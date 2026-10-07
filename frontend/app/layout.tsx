import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "SpamGuard — Intelligent Message & Content Security",
  description:
    "An advanced multimodal AI security platform combining NLP, machine learning, URL heuristics, and computer vision to analyze and explain suspicious text, emails, links, and screenshots.",
  keywords: [
    "SpamGuard",
    "Intelligent Message Security",
    "Multimodal AI",
    "Spam Detection",
    "NLP",
    "Machine Learning",
    "TF-IDF",
    "FastAPI",
    "Next.js",
    "URL Intelligence",
    "Content Security",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full scroll-smooth`}>
      <body className="min-h-full flex flex-col font-sans bg-[#FAF9F6] text-[#202124] antialiased">
        {children}
      </body>
    </html>
  );
}
