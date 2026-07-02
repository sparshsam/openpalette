import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Header } from "@/components/header";
import { Toast } from "@/components/toast";
import { StripFdid } from "@/components/strip-fdid";

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
  title: {
    default: "OpenPalette — Color Studio",
    template: "%s — OpenPalette",
  },
  description:
    "A local-first, open-source color studio for creating palettes, gradients, accessibility checks, exports, and design tokens — all in your browser. No account needed.",
  keywords: ["color palette", "palette generator", "color studio", "design tokens", "WCAG accessibility", "gradient maker", "open source", "design system", "local-first"],
  metadataBase: new URL("https://palette.kovina.org"),
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "OpenPalette",
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "48x48", type: "image/x-icon" },
      { url: "/icons/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/icons/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/openpalette-icon.png", sizes: "1024x1024", type: "image/png" },
      { url: "/icons/openpalette-icon.svg", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/icons/openpalette-icon.png", sizes: "1024x1024", type: "image/png" },
    ],
  },
  openGraph: {
    title: "OpenPalette — Color Studio",
    description:
      "Create palettes, gradients, tokens, accessible previews, and exports directly in your browser.",
    url: "https://palette.kovina.org",
    siteName: "OpenPalette",
    type: "website",
    images: [{ url: "/icons/openpalette-og-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "OpenPalette — Color Studio",
    description:
      "Create palettes, gradients, tokens, accessible previews, and exports directly in your browser.",
    images: ["/icons/openpalette-og-image.png"],
  },
};

export const viewport: Viewport = {
  colorScheme: "dark light",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ff66c4" },
    { media: "(prefers-color-scheme: dark)", color: "#1a0012" },
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
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <head />
      <body className="min-h-full flex flex-col">
        <ThemeProvider>
          <Header />
          <main className="flex-1 w-full" suppressHydrationWarning>{children}</main>
          <Toast />
        </ThemeProvider>
        <StripFdid />
      </body>
    </html>
  );
}
