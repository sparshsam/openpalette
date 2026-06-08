import type { Metadata, Viewport } from "next";
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
  applicationName: "OpenPalette",
  title: "OpenPalette",
  description:
    "A local-first, open-source design color platform with palettes, gradients, accessibility checks, visualizers, imports, exports, and image extraction.",
  metadataBase: new URL("https://github.com/sparshsam/openpalette"),
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "OpenPalette",
    statusBarStyle: "default",
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
  },
  openGraph: {
    title: "OpenPalette",
    description:
      "Build palettes, gradients, tokens, accessible previews, and local libraries directly in your browser.",
    url: "https://github.com/sparshsam/openpalette",
    siteName: "OpenPalette",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "OpenPalette",
    description:
      "A local-first, open-source design color platform.",
  },
};

export const viewport: Viewport = {
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F6F4EF" },
    { media: "(prefers-color-scheme: dark)", color: "#11110F" },
  ],
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
