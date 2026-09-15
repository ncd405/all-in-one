import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";

const inter = Inter({ subsets: ["latin", "vietnamese"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: {
    default: "ALL IN ONE — AI Productivity Suite",
    template: "%s | ALL IN ONE",
  },
  description: "Nền tảng AI đa năng: tải video, tạo ảnh, nâng cấp ảnh, tính ngày, lịch âm và trò chơi — tất cả trong một workspace.",
  keywords: ["all in one", "ai tools", "tải video", "tạo ảnh ai", "lịch âm", "nông trại"],
  openGraph: {
    title: "ALL IN ONE — AI Productivity Suite",
    description: "Tất cả công cụ AI bạn cần trong một workspace duy nhất.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8f9fc" },
    { media: "(prefers-color-scheme: dark)",  color: "#0a0e1a" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={inter.variable} suppressHydrationWarning>
      <body className="min-h-screen antialiased">
        <Navbar />
        {children}
        <Footer />
      </body>
    </html>
  );
}
