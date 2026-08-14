import { Suspense } from "react";
import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Plus_Jakarta_Sans } from "next/font/google";
import { NavigationLoading } from "@/components/navigation-loading";
import "./globals.css";

export const dynamic = "force-dynamic";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Family Finances",
  description: "Shared household income and expenses",
  appleWebApp: {
    capable: true,
    title: "Finances",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#0F3D3E",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${plusJakarta.variable} bg-[var(--background)] antialiased`}>
        <Script id="finman-theme" strategy="beforeInteractive">
          {`try{if(localStorage.getItem('finman-theme')==='dark')document.documentElement.classList.add('dark')}catch(e){}`}
        </Script>
        {children}
        <Suspense fallback={null}>
          <NavigationLoading />
        </Suspense>
      </body>
    </html>
  );
}
