import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
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
    <html lang="en">
      <body className={`${plusJakarta.variable} bg-[var(--background)] antialiased`}>
        {children}
      </body>
    </html>
  );
}
