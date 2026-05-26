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
  title: "Unlost in Translation",
  description: "A smart AI translation tool that sanity-checks intent and context to ensure nothing gets lost in translation.",
  openGraph: {
    title: "Unlost in Translation",
    description: "A smart AI translation tool that sanity-checks intent and context.",
    url: "https://unlost-in-translation.vercel.app",
    siteName: "Unlost in Translation",
    images: [
      {
        url: "/og-image.png",
        width: 1024,
        height: 1024,
        alt: "Unlost in Translation Logo",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Unlost in Translation",
    description: "A smart AI translation tool that sanity-checks intent and context.",
    images: ["/og-image.png"],
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Unlost",
  },
  icons: {
    apple: "/icon.png",
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
      className={`${geistSans.variable} ${geistMono.variable} fixed inset-0 w-full h-full overflow-hidden antialiased`}
    >
      <body suppressHydrationWarning className="w-full h-full overflow-hidden flex flex-col">{children}</body>
    </html>
  );
}
