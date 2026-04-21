import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { TRPCProvider } from "@/components/providers/TRPCProvider";
import { ToastProvider } from "@/components/providers/toast";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: process.env.NEXT_PUBLIC_APP_TITLE || "Structra - Contractor & Homeowner Platform",
  description: process.env.NEXT_PUBLIC_APP_DESCRIPTION || "Connect with trusted contractors and homeowners for your construction projects",
  icons: {
    icon: "/images/brand/favicon_structra.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} antialiased `}
      >
        <TRPCProvider>
          <AuthProvider>
            {children}
            <ToastProvider />
          </AuthProvider>
        </TRPCProvider>
      </body>
    </html>
  );
}
