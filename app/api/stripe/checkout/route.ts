import { NextRequest, NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { getStripe, PLANS, type PlanKey } from "@/lib/stripe/client";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Accept userId from body as fallback — right after register, session cookie
  // may not be set yet even though the user is authenticated client-side.
  const body = await req.json() as { plan: string; userId?: string };
  const { plan } = body;
  const userId = user?.id ?? body.userId;

  if (!userId) {
    return NextResponse.json({ error: "Neautentificat" }, { status: 401 });
  }

  if (!(plan in PLANS)) {
    return NextResponse.json({ error: "Plan invalid" }, { status: 400 });
  }

  const planKey = plan as PlanKey;
  const planData = PLANS[planKey];

  // Use admin client so RLS doesn't block the lookup (works with or without session cookie)
  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: parent } = await admin
    .from("parents")
    .select("email, name, stripe_customer_id")
    .eq("id", userId)
    .single();

  if (!parent) {
    console.error("[checkout] parent not found for userId:", userId);
    return NextResponse.json({ error: "Utilizator negăsit" }, { status: 404 });
  }

  try {
    const stripe = getStripe();

    // Reuse or create Stripe customer
    let customerId = parent.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: parent.email,
        name: parent.name,
        metadata: { supabase_user_id: userId },
      });
      customerId = customer.id;

      await admin
        .from("parents")
        .update({ stripe_customer_id: customerId })
        .eq("id", userId);
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [{ price: planData.stripe_price_id, quantity: 1 }],
      mode: "subscription",
      subscription_data: { trial_period_days: 7 },
      success_url: `${baseUrl}/onboarding?checkout=success`,
      cancel_url: `${baseUrl}/register?plan=${planKey}&checkout=cancelled`,
      allow_promotion_codes: true,
      metadata: { supabase_user_id: userId, plan: planKey },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("[checkout] Stripe error:", err);
    return NextResponse.json({ error: "Eroare Stripe", detail: String(err) }, { status: 500 });
  }
}
