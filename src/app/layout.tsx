import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "OpenPalette",
  description:
    "A local-first, open-source five-color palette generator built with Next.js, TypeScript, and Tailwind CSS.",
  metadataBase: new URL("https://github.com/sparshsam/openpalette"),
  openGraph: {
    title: "OpenPalette",
    description:
      "Generate, lock, edit, copy, and save five-color palettes locally in your browser.",
    url: "https://github.com/sparshsam/openpalette",
    siteName: "OpenPalette",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "OpenPalette",
    description:
      "A local-first, open-source five-color palette generator.",
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
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
