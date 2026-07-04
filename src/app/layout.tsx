import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "VibeMarket — Sell what you build with AI",
    template: "%s · VibeMarket",
  },
  description:
    "Showcase and sell what you build with AI — apps, agents, automations, and more. A marketplace for the people who build with AI.",
  keywords: [
    "vibe coding",
    "AI builders",
    "sell AI apps",
    "AI agents",
    "automations",
  ],
  openGraph: {
    title: "VibeMarket — Sell what you build with AI",
    description:
      "Showcase and sell what you build with AI — apps, agents, automations, and more.",
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
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-zinc-50">
        <Providers>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
