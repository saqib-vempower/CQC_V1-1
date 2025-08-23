import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import React from "react";
import { cn } from "@/lib/utils";
import { AuthProvider } from '@/components/cqc/auth-provider';

const inter = Inter({ subsets: ["latin"], display: 'swap', variable: "--font-sans", });

export const metadata: Metadata = {
  title: "Call Quality Compass",
  description: "Auditing for university admissions calls.",
  viewport: "width=device-width, initial-scale=1",
  themeColor: "#ffffff",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn("min-h-screen bg-background font-sans antialiased", inter.variable)}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
