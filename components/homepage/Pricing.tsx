import Link from "next/link";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import type { Lang } from "@/lib/i18n";
import { ro, en } from "@/lib/i18n";

interface PricingProps {
  lang?: Lang;
}

export default function Pricing({ lang = "ro" }: PricingProps) {
  const t = lang === "en" ? en : ro;
  const { plans } = t.pricing;

  return (
    <section id="preturi" className="py-16 sm:py-24 bg-[#FAFAF5]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10 sm:mb-14">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#0D1B2A] mb-4"
            style={{ fontFamily: "var(--font-display)" }}>
            {t.pricing.title}
          </h2>
          <p className="text-[#9B9A93] text-base sm:text-lg max-w-2xl mx-auto">
            {t.pricing.subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">

          {/* ESSENTIAL */}
          <Card className="p-6 sm:p-8 flex flex-col gap-5">
            <div>
              <p className="text-[#9B9A93] text-xs font-semibold uppercase tracking-widest mb-2">
                {plans.essential.name}
              </p>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl sm:text-4xl font-black text-[#0D1B2A]" style={{ fontFamily: "var(--font-mono)" }}>
                  {plans.essential.price}
                </span>
                <span className="text-[#9B9A93] text-sm">{plans.essential.period}</span>
              </div>
              <p className="text-[#9B9A93] text-sm mt-1">{plans.essential.children}</p>
            </div>
            <ul className="flex flex-col gap-2.5 flex-1">
              {plans.essential.features.map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-[#3D3C37]">
                  <svg className="w-4 h-4 text-[#1D9E75] flex-shrink-0 mt-0.5" viewBox="0 0 16 16" fill="none">
                    <path d="M3 8l3.5 3.5L13 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {f}
                </li>
              ))}
            </ul>
            <Link href="/register?plan=essential"
              className="w-full py-3 rounded-full border-2 border-[#E8A020] text-[#E8A020] font-semibold text-center text-sm hover:bg-[#E8A020] hover:text-[#92520A] transition-all">
              {t.pricing.cta}
            </Link>
          </Card>

          {/* FAMILY — featured */}
          <Card className="p-6 sm:p-8 flex flex-col gap-5 border-2 border-[#3ECDA0] relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <Badge variant="teal">{t.pricing.popular}</Badge>
            </div>
            <div>
              <p className="text-[#9B9A93] text-xs font-semibold uppercase tracking-widest mb-2">
                {plans.family.name}
              </p>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl sm:text-4xl font-black text-[#0D1B2A]" style={{ fontFamily: "var(--font-mono)" }}>
                  {plans.family.price}
                </span>
                <span className="text-[#9B9A93] text-sm">{plans.family.period}</span>
              </div>
              <p className="text-[#9B9A93] text-sm mt-1">{plans.family.children}</p>
            </div>
            <ul className="flex flex-col gap-2.5 flex-1">
              {plans.family.features.map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-[#3D3C37]">
                  <svg className="w-4 h-4 text-[#3ECDA0] flex-shrink-0 mt-0.5" viewBox="0 0 16 16" fill="none">
                    <path d="M3 8l3.5 3.5L13 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {f}
                </li>
              ))}
            </ul>
            <Link href="/register?plan=family"
              className="w-full py-3 rounded-full bg-[#1D9E75] text-white font-semibold text-center text-sm hover:bg-[#1B5E4F] transition-all">
              {t.pricing.cta}
            </Link>
          </Card>

          {/* ANNUAL */}
          <Card className="p-6 sm:p-8 flex flex-col gap-5 relative sm:col-span-2 lg:col-span-1">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <Badge variant="amber">{t.pricing.savings}</Badge>
            </div>
            <div>
              <p className="text-[#9B9A93] text-xs font-semibold uppercase tracking-widest mb-2">
                {plans.annual.name}
              </p>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl sm:text-4xl font-black text-[#0D1B2A]" style={{ fontFamily: "var(--font-mono)" }}>
                  {plans.annual.price}
                </span>
                <span className="text-[#9B9A93] text-sm">{plans.annual.period}</span>
              </div>
              <p className="text-[#9B9A93] text-sm mt-1">{plans.annual.children}</p>
            </div>
            <ul className="flex flex-col gap-2.5 flex-1">
              {plans.annual.features.map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-[#3D3C37]">
                  <svg className="w-4 h-4 text-[#1D9E75] flex-shrink-0 mt-0.5" viewBox="0 0 16 16" fill="none">
                    <path d="M3 8l3.5 3.5L13 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {f}
                </li>
              ))}
            </ul>
            <Link href="/register?plan=annual"
              className="w-full py-3 rounded-full border-2 border-[#E8A020] text-[#E8A020] font-semibold text-center text-sm hover:bg-[#E8A020] hover:text-[#92520A] transition-all">
              {t.pricing.ctaAnnual}
            </Link>
          </Card>
        </div>

        <p className="text-center text-[#9B9A93] text-sm mt-8 max-w-xl mx-auto">
          {t.pricing.trialNote}
        </p>
      </div>
    </section>
  );
}
