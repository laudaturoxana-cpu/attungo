import Accordion from "@/components/ui/Accordion";
import type { Lang } from "@/lib/i18n";
import { ro, en } from "@/lib/i18n";

interface FAQProps {
  lang?: Lang;
}

export default function FAQ({ lang = "ro" }: FAQProps) {
  const t = lang === "en" ? en : ro;

  return (
    <section id="faq" className="py-24 bg-[#FAFAF5]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <h2
            className="text-4xl sm:text-5xl font-bold text-[#0D1B2A]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {t.faq.title}
          </h2>
        </div>
        <Accordion items={t.faq.items.map(item => ({ q: item.q, a: item.a }))} />
      </div>
    </section>
  );
}
