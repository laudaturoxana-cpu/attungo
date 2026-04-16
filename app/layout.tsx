import type { Metadata } from "next";
import { Playfair_Display, DM_Sans, DM_Mono } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "700", "900"],
  style: ["normal", "italic"],
  display: "swap",
});

const dmSans = DM_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
});

const dmMono = DM_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  interactiveWidget: "resizes-content",
};

export const metadata: Metadata = {
  title: "Attungo: Tutorele care ascultă.",
  description:
    "Cunoaște-l pe Atto, licuriciul care ghidează copilul tău prin lecții. Nu dă răspunsul. Aprinde lumina ca el să îl găsească singur.",
  keywords: ["tutore AI", "meditații online", "copii", "Romania", "matematica", "engleza"],
  authors: [{ name: "Attungo" }],
  openGraph: {
    title: "Attungo: Tutorele care ascultă.",
    description: "AI tutore adaptiv pentru copii, clasele 1-8, în română și engleză.",
    siteName: "Attungo",
    locale: "ro_RO",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ro"
      className={`${playfair.variable} ${dmSans.variable} ${dmMono.variable} h-full`}
    >
      <body className="min-h-full flex flex-col antialiased">{children}</body>
    </html>
  );
}
