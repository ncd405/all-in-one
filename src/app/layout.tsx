import type { Metadata, Viewport } from "next";
import "./globals.css";
import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";

export const metadata: Metadata = {
  title: {
    default: "ALL IN ONE — Công cụ & Trò chơi đa năng",
    template: "%s | ALL IN ONE",
  },
  description: "Nền tảng tích hợp công cụ tải video, chuyển đổi MP3, tính ngày, xem lịch âm và trò chơi giải trí — miễn phí, không quảng cáo.",
  keywords: ["all in one", "tải video", "chuyển mp3", "lịch âm", "tính ngày", "nông trại", "solitaire"],
  authors: [{ name: "ALL IN ONE" }],
  openGraph: {
    title: "ALL IN ONE — Công cụ & Trò chơi đa năng",
    description: "Tất cả công cụ và trò chơi bạn cần trong một website duy nhất.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f9fafb" },
    { media: "(prefers-color-scheme: dark)",  color: "#030712" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 antialiased">
        <Navbar />
        {children}
        <Footer />
      </body>
    </html>
  );
}