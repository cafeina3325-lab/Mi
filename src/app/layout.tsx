import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

export const metadata: Metadata = {
  title: "MouseI | Premium Spatial Experience",
  description: "Next-generation 3D Spatial Studio & Digital Vision Extraction",
  keywords: ["3D", "Spatial Design", "Digital Studio", "Innovation"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${inter.variable} ${outfit.variable} antialiased`}>
      <body className="font-sans">{children}</body>
    </html>
  );
}
