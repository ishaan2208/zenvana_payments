import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { InitialSplash } from "@/components/InitialSplash";
import { AppShell } from "@/components/app-shell";
import { PaytmNoticeGate } from "@/components/paytm-notice-gate";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Zenvana Payments",
  description: "Front-office payment collection portal for Zenvana",
  icons: {
    icon: "/Zenvana%20logo/icon.svg",
    shortcut: "/Zenvana%20logo/icon.svg",
    apple: "/Zenvana%20logo/icon.svg",
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
      <body className="min-h-full flex flex-col">
        <ThemeProvider>
          <PaytmNoticeGate>
            <InitialSplash />
            <AppShell>{children}</AppShell>
          </PaytmNoticeGate>
        </ThemeProvider>
      </body>
    </html>
  );
}
