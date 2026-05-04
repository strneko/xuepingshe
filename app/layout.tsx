import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "react-photo-view/dist/react-photo-view.css";
import Navbar from "@/components/navbar";
import { Toaster } from "@/components/ui/sonner";
import AuthDialog from "@/components/auth-dialog";
import NotificationProvider from "@/components/notification-provider";

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
        <AuthDialog />
        <NotificationProvider />
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
