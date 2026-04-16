import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe/client";
import { createClient } from "@/lib/supabase/server";
import type Stripe from "stripe";

// Force dynamic — nu e pre-rendered la build (necesită env vars reale)
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    return NextResponse.json({ error: "Missing signature or secret" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    const stripeInstance = getStripe();
    event = stripeInstance.webhooks.constructEvent(body, sig, webhookSecret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = await createClient();

  switch (event.type) {
    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      const customerId = sub.customer as string;

      const planMap: Record<string, string> = {
        [process.env.STRIPE_PRICE_ESSENTIAL_MONTHLY ?? ""]: "essential",
        [process.env.STRIPE_PRICE_FAMILY_MONTHLY ?? ""]: "family",
        [process.env.STRIPE_PRICE_ANNUAL ?? ""]: "annual",
      };

      const priceId = sub.items.data[0]?.price.id ?? "";
      const plan = planMap[priceId] ?? "essential";
      const isActive = ["active", "trialing"].includes(sub.status);

      // Update parent subscription (cast plan/status to the union types)
      await supabase
        .from("parents")
        .update({
          subscription_plan: (isActive ? plan : "cancelled") as "trial" | "essential" | "family" | "annual" | "cancelled",
          subscription_status: (["active","trialing"].includes(sub.status) ? "active" : sub.status === "past_due" ? "past_due" : "cancelled") as "active" | "cancelled" | "past_due" | "paused",
          stripe_subscription_id: sub.id,
        })
        .eq("stripe_customer_id", customerId);

      // Upsert subscriptions table
      // Note: billing_cycle_anchor replaced current_period_start/end in Stripe API v2026
      const subAny = sub as unknown as Record<string, unknown>;
      const periodStart = (subAny["current_period_start"] as number | undefined)
        ?? (subAny["billing_cycle_anchor"] as number | undefined);
      const periodEnd = (subAny["current_period_end"] as number | undefined);

      // Find parent_id from stripe_customer_id
      const { data: parentData } = await supabase
        .from("parents")
        .select("id")
        .eq("stripe_customer_id", customerId)
        .single();

      if (parentData) {
        await supabase.from("subscriptions").upsert({
          parent_id: parentData.id,
          stripe_subscription_id: sub.id,
          stripe_customer_id: customerId,
          plan: plan as "essential" | "family" | "annual",
          status: sub.status as string,
          current_period_start: periodStart ? new Date(periodStart * 1000).toISOString() : null,
          current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
          cancel_at_period_end: sub.cancel_at_period_end,
          amount_eur: (sub.items.data[0]?.price.unit_amount ?? 0) / 100,
        }, { onConflict: "stripe_subscription_id" });
      }

      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const customerId = sub.customer as string;

      await supabase
        .from("parents")
        .update({ subscription_plan: "cancelled" as const, subscription_status: "cancelled" as const })
        .eq("stripe_customer_id", customerId);

      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = invoice.customer as string;

      await supabase
        .from("parents")
        .update({ subscription_status: "past_due" as const })
        .eq("stripe_customer_id", customerId);

      break;
    }

    case "invoice.payment_succeeded": {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = invoice.customer as string;

      await supabase
        .from("parents")
        .update({ subscription_status: "active" as const })
        .eq("stripe_customer_id", customerId);

      break;
    }
  }

  return NextResponse.json({ received: true });
}
