import Stripe from "stripe";

export function getStripe(): Stripe {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2026-03-25.dahlia",
  });
}

export const PLANS = {
  essential: {
    name: "Essential",
    price_eur: 16,
    stripe_price_id: process.env.STRIPE_PRICE_ESSENTIAL_MONTHLY!,
    interval: "month" as const,
    children_limit: 1,
    features_ro: [
      "Sesiuni nelimitate",
      "Atto personalizat per copil",
      "Vocea lui Atto (TTS)",
      "Raport săptămânal",
      "RO + EN curriculum",
    ],
    features_en: [
      "Unlimited sessions",
      "Atto personalised per child",
      "Atto's voice (TTS)",
      "Weekly report",
      "RO + EN curriculum",
    ],
  },
  family: {
    name: "Family",
    price_eur: 26,
    stripe_price_id: process.env.STRIPE_PRICE_FAMILY_MONTHLY!,
    interval: "month" as const,
    children_limit: 3,
    features_ro: [
      "3 profiluri individuale separate",
      "3 Atto cu personalizare diferită",
      "Detectare pasiuni avansată",
      "Dashboard părinți complet",
      "Rapoarte individuale per copil",
    ],
    features_en: [
      "3 separate individual profiles",
      "3 Attos with different personalisation",
      "Advanced passion detection",
      "Full parent dashboard",
      "Individual reports per child",
    ],
  },
  annual: {
    name: "Annual",
    price_eur: 142,
    stripe_price_id: process.env.STRIPE_PRICE_ANNUAL!,
    interval: "year" as const,
    children_limit: 1,
    features_ro: [
      "Echivalent €12/lună",
      "Tot ce include Essential",
      "Plătești o dată, uiți de el",
      "Prioritate funcții noi",
    ],
    features_en: [
      "Equivalent to €12/month",
      "Everything in Essential",
      "Pay once, forget about it",
      "Priority for new features",
    ],
  },
} as const;

export type PlanKey = keyof typeof PLANS;
