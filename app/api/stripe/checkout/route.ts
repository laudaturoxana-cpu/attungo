import { NextRequest, NextResponse } from "next/server";
import { getStripe, PLANS, type PlanKey } from "@/lib/stripe/client";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Neautentificat" }, { status: 401 });
  }

  const { plan } = await req.json() as { plan: string };

  if (!(plan in PLANS)) {
    return NextResponse.json({ error: "Plan invalid" }, { status: 400 });
  }

  const planKey = plan as PlanKey;
  const planData = PLANS[planKey];

  const { data: parent } = await supabase
    .from("parents")
    .select("email, name, stripe_customer_id")
    .eq("id", user.id)
    .single();

  if (!parent) {
    return NextResponse.json({ error: "Utilizator negăsit" }, { status: 404 });
  }

  const stripe = getStripe();

  // Reuse or create Stripe customer
  let customerId = parent.stripe_customer_id;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: parent.email,
      name: parent.name,
      metadata: { supabase_user_id: user.id },
    });
    customerId = customer.id;

    await supabase
      .from("parents")
      .update({ stripe_customer_id: customerId })
      .eq("id", user.id);
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ["card"],
    line_items: [
      {
        price: planData.stripe_price_id,
        quantity: 1,
      },
    ],
    mode: "subscription",
    subscription_data: {
      trial_period_days: 7,
    },
    success_url: `${baseUrl}/onboarding?checkout=success`,
    cancel_url: `${baseUrl}/register?plan=${planKey}&checkout=cancelled`,
    allow_promotion_codes: true,
    metadata: {
      supabase_user_id: user.id,
      plan: planKey,
    },
  });

  return NextResponse.json({ url: session.url });
}
