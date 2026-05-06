import type { Metadata } from "next";
import { ZCOOL_QingKe_HuangYou, Noto_Sans_SC, Geist_Mono } from "next/font/google";
import "./globals.css";
import "react-photo-view/dist/react-photo-view.css";
import Navbar from "@/components/navbar";
import { Toaster } from "@/components/ui/sonner";
import AuthDialog from "@/components/auth-dialog";
import NotificationProvider from "@/components/notification-provider";

const zcoolHeading = ZCOOL_QingKe_HuangYou({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  variable: "--font-heading",
});

const notoSansSC = Noto_Sans_SC({
  weight: ["400", "500", "700"],
  subsets: ["latin"],
  display: "swap",
  preload: false,
  variable: "--font-noto-sans-sc",
});

const geistMono = Geist_Mono({
  weight: ["400", "700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-geist-mono",
});

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
    <html lang="zh" suppressHydrationWarning>
      <body className={`${zcoolHeading.variable} ${notoSansSC.variable} ${geistMono.variable}`}>
        <Navbar />
        <AuthDialog />
        <NotificationProvider />
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
