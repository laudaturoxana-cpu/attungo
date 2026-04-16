import Card from "@/components/ui/Card";
import type { Lang } from "@/lib/i18n";
import { ro, en } from "@/lib/i18n";

interface ForWhoSectionProps {
  lang?: Lang;
}

const CARD_ICONS = ["🏫", "🏠", "📚", "✈️"];

export default function ForWhoSection({ lang = "ro" }: ForWhoSectionProps) {
  const t = lang === "en" ? en : ro;
  const cards = [t.forWho.card1, t.forWho.card2, t.forWho.card3, t.forWho.card4];

  return (
    <section id="pentru-cine" className="py-16 sm:py-24 bg-[#FAFAF5]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10 sm:mb-16">
          <h2
            className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#0D1B2A] mb-4"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {t.forWho.title}
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {cards.map((card, i) => (
            <Card key={i} hover className="p-5 sm:p-6 flex flex-col gap-4 group">
              <div className="w-12 h-12 rounded-2xl bg-[#FEF3C7] flex items-center justify-center text-2xl group-hover:scale-110 transition-transform flex-shrink-0">
                {CARD_ICONS[i]}
              </div>
              <h3 className="text-base sm:text-lg font-bold text-[#0D1B2A] leading-snug" style={{ fontFamily: "var(--font-display)" }}>
                {card.title}
              </h3>
              <p className="text-[#9B9A93] text-sm leading-relaxed flex-1">{card.text}</p>
              <div className="pt-3 border-t border-[#E5E3DC]">
                <p className="text-xs text-[#3ECDA0] font-semibold">{card.bullets}</p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
