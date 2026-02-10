import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/navbar";

export const metadata: Metadata = {
  title: "学评社",
  description: "发现好老师，分享真评价",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh">
      <body>
        <Navbar />
        {children}
      </body>
    </html>
  );
}
