import AttoCharacter from "@/components/atto/AttoCharacter";
import type { Lang } from "@/lib/i18n";
import { ro, en } from "@/lib/i18n";

interface HowItWorksProps {
  lang?: Lang;
}

const STEP_ICONS = [
  <svg key="listen" width="28" height="28" viewBox="0 0 28 28" fill="none">
    <path d="M4 14 Q7 8 10 14 Q13 20 16 14 Q19 8 22 14 Q25 20 28 14" stroke="#3ECDA0" strokeWidth="2" strokeLinecap="round" fill="none" />
  </svg>,
  <svg key="guide" width="28" height="28" viewBox="0 0 28 28" fill="none">
    <circle cx="14" cy="14" r="5" fill="#E8A020" />
    <circle cx="14" cy="14" r="9" fill="#E8A020" opacity="0.2" />
    <path d="M14 3v4M14 21v4M3 14h4M21 14h4" stroke="#E8A020" strokeWidth="1.8" strokeLinecap="round" />
  </svg>,
  <svg key="report" width="28" height="28" viewBox="0 0 28 28" fill="none">
    <rect x="4" y="16" width="5" height="8" rx="1" fill="#3ECDA0" />
    <rect x="11" y="10" width="5" height="14" rx="1" fill="#3ECDA0" opacity="0.7" />
    <rect x="18" y="4" width="5" height="20" rx="1" fill="#3ECDA0" opacity="0.4" />
  </svg>,
];

export default function HowItWorks({ lang = "ro" }: HowItWorksProps) {
  const t = lang === "en" ? en : ro;
  const steps = [t.howItWorks.step1, t.howItWorks.step2, t.howItWorks.step3];

  return (
    <section id="cum-functioneaza" className="py-16 sm:py-24 bg-[#0D1B2A] relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: "radial-gradient(circle, #3ECDA0 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 sm:mb-16">
          <h2
            className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {t.howItWorks.title}
          </h2>
          <div className="flex justify-center mt-6">
            <AttoCharacter state="happy" size={88} />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-10 relative">
          <div className="hidden sm:block absolute top-8 left-1/4 right-1/4 h-px bg-gradient-to-r from-[#3ECDA0]/30 via-[#E8A020]/30 to-[#3ECDA0]/30" />

          {steps.map((step, i) => (
            <div key={i} className="flex flex-col items-center text-center gap-4 sm:gap-5">
              <div className="relative">
                <div className="w-16 h-16 rounded-full bg-[#1B2C3E] border border-white/10 flex items-center justify-center">
                  {STEP_ICONS[i]}
                </div>
                <span
                  className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[#E8A020] text-[#92520A] text-xs font-bold flex items-center justify-center"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  {i + 1}
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white" style={{ fontFamily: "var(--font-display)" }}>
                {step.title}
              </h3>
              <p className="text-white/60 text-sm sm:text-base leading-relaxed">{step.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
