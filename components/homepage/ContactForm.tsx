"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import type { Lang } from "@/lib/i18n";

interface ContactFormProps {
  lang?: Lang;
}

export default function ContactForm({ lang = "ro" }: ContactFormProps) {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    setSent(true);
    setLoading(false);
  }

  return (
    <section id="contact" className="py-16 sm:py-24 bg-white">
      <div className="max-w-xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-8 sm:mb-12">
          <h2
            className="text-3xl sm:text-4xl font-bold text-[#0D1B2A] mb-3"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {lang === "ro" ? "Întreabă-ne orice" : "Ask us anything"}
          </h2>
          <p className="text-[#9B9A93] text-sm sm:text-base">
            {lang === "ro"
              ? "Îți răspundem în 24h, de regulă mult mai repede."
              : "We reply within 24h, usually much faster."}
          </p>
        </div>

        {sent ? (
          <div className="text-center py-12">
            <div className="text-5xl mb-4">✨</div>
            <p className="text-[#1D9E75] font-semibold text-lg">
              {lang === "ro" ? "Mulțumim! Îți scriem în curând." : "Thanks! We'll be in touch soon."}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:gap-4">
            <input
              type="text"
              required
              placeholder={lang === "ro" ? "Numele tău" : "Your name"}
              className="px-4 py-3 rounded-xl border border-[#E5E3DC] bg-[#FAFAF5] text-[#3D3C37] placeholder-[#9B9A93] focus:outline-none focus:ring-2 focus:ring-[#E8A020]/40 text-base"
            />
            <input
              type="email"
              required
              placeholder={lang === "ro" ? "Email-ul tău" : "Your email"}
              className="px-4 py-3 rounded-xl border border-[#E5E3DC] bg-[#FAFAF5] text-[#3D3C37] placeholder-[#9B9A93] focus:outline-none focus:ring-2 focus:ring-[#E8A020]/40 text-base"
            />
            <textarea
              required
              rows={4}
              placeholder={lang === "ro" ? "Mesajul tău..." : "Your message..."}
              className="px-4 py-3 rounded-xl border border-[#E5E3DC] bg-[#FAFAF5] text-[#3D3C37] placeholder-[#9B9A93] focus:outline-none focus:ring-2 focus:ring-[#E8A020]/40 resize-none text-base"
            />
            <Button type="submit" variant="amber" size="lg" disabled={loading} className="w-full">
              {loading
                ? lang === "ro" ? "Se trimite..." : "Sending..."
                : lang === "ro" ? "Trimite mesajul →" : "Send message →"}
            </Button>
          </form>
        )}
      </div>
    </section>
  );
}
