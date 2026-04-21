import type { Metadata } from "next";
import { JetBrains_Mono, Inter_Tight } from "next/font/google";
import "./globals.css";

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const interTight = Inter_Tight({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Banyan Deal Engine",
  description: "Professional real estate underwriting terminal for BRRRR and NNN/Industrial deals.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${jetbrainsMono.variable} ${interTight.variable} h-full`}>
      <body className="min-h-full bg-bg text-ink antialiased">{children}</body>
    </html>
  );
}
