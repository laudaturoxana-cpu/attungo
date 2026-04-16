"use client";

import { useState } from "react";
import type { Lang } from "@/lib/i18n";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Hero from "@/components/homepage/Hero";
import ForWhoSection from "@/components/homepage/ForWhoSection";
import HowItWorks from "@/components/homepage/HowItWorks";
import Pricing from "@/components/homepage/Pricing";
import FAQ from "@/components/homepage/FAQ";
import Manifest from "@/components/homepage/Manifest";
import ContactForm from "@/components/homepage/ContactForm";

export default function HomePage() {
  const [lang, setLang] = useState<Lang>("ro");

  return (
    <div className="flex flex-col min-h-screen">
      <Header lang={lang} onLangChange={setLang} />
      <main className="flex-1">
        <Hero lang={lang} />
        <ForWhoSection lang={lang} />
        <HowItWorks lang={lang} />
        <Pricing lang={lang} />
        <FAQ lang={lang} />
        <ContactForm lang={lang} />
        <Manifest lang={lang} />
      </main>
      <Footer lang={lang} />
    </div>
  );
}
