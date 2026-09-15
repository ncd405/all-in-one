"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, Menu, X } from "lucide-react";
import { useState } from "react";

const products = [
  { href: "/tools/ai-image", label: "Tạo Ảnh AI", desc: "DALL-E 3 từ mô tả tiếng Việt", badge: "NEW" },
  { href: "/tools/ai-upscaler", label: "Nâng Cấp Ảnh", desc: "WebGPU upscaler 2x/4x", badge: "NEW" },
  { href: "/tools/video-downloader", label: "Tải Video", desc: "YouTube & TikTok không watermark" },
  { href: "/tools/mp3-converter", label: "Chuyển MP3", desc: "Trích xuất âm thanh chất lượng cao" },
  { href: "/tools/date-calculator", label: "Tính Ngày", desc: "Khoảng cách ngày/tuần/tháng" },
  { href: "/tools/lunar-calendar", label: "Lịch Âm", desc: "Âm dương lịch, can chi" },
  { href: "/games/farm", label: "Nông Trại", desc: "Game kéo thả thư giãn" },
  { href: "/games/solitaire", label: "Xếp Bài", desc: "Solitaire cổ điển" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      <nav className="sticky top-0 z-50 bg-[#0a0a0b]/80 backdrop-blur-xl border-b border-[#26262a]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <span className="text-xl font-black tracking-tight text-white">
              ALL IN ONE
            </span>
            <span className="w-8 h-8 rounded-full bg-[#22d3ee] flex items-center justify-center">
              <span className="text-black font-black text-[11px]">AI</span>
            </span>
          </Link>

          {/* Desktop links */}
          <div className="hidden lg:flex items-center gap-6">
            {["Tools", "Games"].map((label) => (
              <button
                key={label}
                className="text-sm text-[#a1a1a6] hover:text-white transition-colors"
                onClick={() => setOpen(!open)}
              >
                {label === "Tools" ? "Công cụ" : "Giải trí"}
              </button>
            ))}
            <Link href="/tools/ai-image" className="text-sm text-[#a1a1a6] hover:text-white transition-colors">
              Pricing
            </Link>
          </div>

          {/* Right actions */}
          <div className="hidden md:flex items-center gap-2">
            <button className="px-4 py-2 text-sm font-medium text-white rounded-xl border border-[#3a3a40] hover:bg-[#141416] transition-colors">
              Đăng nhập
            </button>
            <Link
              href="/tools/ai-image"
              className="px-4 py-2 text-sm font-semibold bg-[#22d3ee] text-black rounded-xl hover:bg-[#06b6d4] transition-colors flex items-center gap-1.5"
            >
              Đăng ký <ArrowRight className="w-3.5 h-3.5" strokeWidth={2.5} />
            </Link>
          </div>

          {/* Mobile toggle */}
          <button
            className="md:hidden p-2 text-white"
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
          >
            {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </nav>

      {/* Mobile full-screen menu */}
      {open && (
        <div className="md:hidden fixed inset-0 z-40 bg-[#0a0a0b] overflow-y-auto pt-16">
          <div className="px-6 py-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-white">Sản phẩm</h3>
              <button onClick={() => setOpen(false)} className="p-2 text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-1 mb-8">
              {products.map((p) => (
                <Link
                  key={p.href}
                  href={p.href}
                  onClick={() => setOpen(false)}
                  className="block py-4 border-b border-[#26262a]"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-base font-semibold text-white">{p.label}</span>
                    {p.badge && <span className="badge-new">{p.badge}</span>}
                  </div>
                  <p className="text-sm text-[#71717a] leading-snug">{p.desc}</p>
                </Link>
              ))}
            </div>

            <div className="flex gap-3">
              <button className="flex-1 py-3 rounded-xl border border-[#3a3a40] text-white font-medium text-sm">
                Đăng nhập
              </button>
              <Link
                href="/tools/ai-image"
                onClick={() => setOpen(false)}
                className="flex-1 py-3 rounded-xl bg-white text-black font-semibold text-sm text-center"
              >
                Đăng ký
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
