import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

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
  title: "OpenPalette — Color Studio",
  description:
    "A local-first, open-source color studio for creating palettes, gradients, accessibility checks, exports, and design tokens — all in your browser.",
  metadataBase: new URL("https://github.com/sparshsam/openpalette"),
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "OpenPalette",
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      { url: "/icons/openpalette-icon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: [
      { url: "/icons/openpalette-icon.png", sizes: "1024x1024", type: "image/png" },
    ],
  },
  openGraph: {
    title: "OpenPalette — Color Studio",
    description:
      "Create palettes, gradients, tokens, accessible previews, and exports directly in your browser.",
    url: "https://github.com/sparshsam/openpalette",
    siteName: "OpenPalette",
    type: "website",
    images: [{ url: "/icons/openpalette-icon.png", width: 1024, height: 1024 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "OpenPalette — Color Studio",
    description: "A local-first, open-source color studio.",
    images: ["/icons/openpalette-icon.png"],
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
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider>
          <Header />
          <main className="flex-1 w-full">{children}</main>
          <Footer />
        </ThemeProvider>
        {/* Strip browser-extension injected attributes before React hydrates */}
        <Script
          id="strip-extension-attrs"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(){var a=document.querySelectorAll("[fdprocessedid]");for(var i=0;i<a.length;i++)a[i].removeAttribute("fdprocessedid")})();`,
          }}
        />
      </body>
    </html>
  );
}
