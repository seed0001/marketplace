import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ParticleBackground } from "@/components/ParticleBackground";
import { WebsiteBroadcast } from "@/components/WebsiteBroadcast";

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
    default: "VibeMarket — Sell your work, your services, your reputation",
    template: "%s · VibeMarket",
  },
  description:
    "From weekend projects to enterprise systems — the marketplace where anyone can sell what they make and the time it takes to make it. Every sale builds a portfolio that proves your track record.",
  keywords: [
    "sell products and services",
    "freelance marketplace",
    "maker marketplace",
    "software architect for hire",
    "portfolio",
    "digital goods",
  ],
  openGraph: {
    title: "VibeMarket — Sell your work, your services, your reputation",
    description:
      "From weekend projects to enterprise systems — sell what you make and the time it takes to make it. Every sale builds your portfolio.",
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
      <body className="min-h-full flex flex-col bg-zinc-950">
        <ParticleBackground />
        <Providers>
          <div className="relative z-10 flex flex-col min-h-full">
            <Navbar />
            <WebsiteBroadcast />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
