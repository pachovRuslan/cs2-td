import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css"; 
import ReduxProvider from "@/components/providers/ReduxProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CS2 Dust2 — Tower Defense",
  description:
    "2D Tower Defense в стиле CS2 на карте Dust2. Защити CT-spawn от террористов!",
  keywords: ["CS2", "Dust2", "Tower Defense", "Phaser", "Next.js"],
  authors: [{ name: "Your Name" }],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-zinc-950 text-zinc-100`}
      >
        <ReduxProvider>{children}</ReduxProvider>
      </body>
    </html>
  );
}