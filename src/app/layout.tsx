import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";

const inter = Inter({
  subsets: ["latin", "vietnamese"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "ALL IN ONE — AI Creative Toolkit",
    template: "%s | ALL IN ONE",
  },
  description: "AI toolkit đa năng: tạo ảnh, tải video, chuyển định dạng, tính ngày, lịch âm và trò chơi — trong một workspace.",
  keywords: ["ai toolkit", "tạo ảnh ai", "tải video", "lịch âm", "nông trại"],
  openGraph: {
    title: "ALL IN ONE — AI Creative Toolkit",
    description: "Tất cả công cụ AI bạn cần trong một workspace duy nhất.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0b",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={inter.variable}>
      <body className="min-h-screen antialiased">
        <Navbar />
        {children}
        <Footer />
      </body>
    </html>
  );
}
