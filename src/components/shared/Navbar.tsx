"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles, Menu, X, Search, Zap } from "lucide-react";
import { useState } from "react";

const groups = [
  {
    label: "AI Tools",
    links: [
      { href: "/tools/ai-image", label: "Tạo Ảnh AI", badge: "New" },
      { href: "/tools/ai-upscaler", label: "Nâng Cấp Ảnh" },
      { href: "/tools/video-downloader", label: "Tải Video", badge: "Hot" },
      { href: "/tools/mp3-converter", label: "Chuyển MP3" },
    ],
  },
  {
    label: "Tiện ích",
    links: [
      { href: "/tools/date-calculator", label: "Tính Ngày" },
      { href: "/tools/lunar-calendar", label: "Lịch Âm" },
    ],
  },
  {
    label: "Giải trí",
    links: [
      { href: "/games/farm", label: "Nông Trại" },
      { href: "/games/solitaire", label: "Xếp Bài" },
    ],
  },
];

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      <nav className="sticky top-0 z-40 bg-white/80 dark:bg-[#0a0e1a]/80 backdrop-blur-xl border-b border-[#e8ecf3] dark:border-[#1e2538]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-sm">
              <Zap className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
            <span className="font-semibold text-[15px] tracking-tight text-[#0f1729] dark:text-white">
              ALL IN ONE
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden lg:flex items-center gap-1 flex-1 justify-center">
            {groups.flatMap(g => g.links).map((l) => {
              const active = pathname === l.href;
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`px-3 py-1.5 rounded-lg text-[13px] font-medium transition-colors ${
                    active
                      ? "bg-[#eef2ff] dark:bg-[#1e1b4b] text-indigo-600 dark:text-indigo-400"
                      : "text-[#4a5568] dark:text-[#b8c2d9] hover:text-[#0f1729] dark:hover:text-white hover:bg-[#f1f3f9] dark:hover:bg-[#161b2e]"
                  }`}
                >
                  {l.label}
                </Link>
              );
            })}
          </div>

          {/* Right actions */}
          <div className="hidden lg:flex items-center gap-2">
            <button className="p-2 rounded-lg hover:bg-[#f1f3f9] dark:hover:bg-[#161b2e] text-[#8894a8] transition-colors">
              <Search className="w-4 h-4" />
            </button>
            <Link
              href="/tools/ai-image"
              className="px-3.5 py-1.5 rounded-lg bg-[#0f1729] dark:bg-white text-white dark:text-[#0f1729] text-[13px] font-medium hover:opacity-90 transition-opacity flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" /> Thử AI
            </Link>
          </div>

          {/* Mobile toggle */}
          <button
            className="lg:hidden p-2 rounded-lg hover:bg-[#f1f3f9] dark:hover:bg-[#161b2e]"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile drawer */}
      {open && (
        <div className="lg:hidden border-b border-[#e8ecf3] dark:border-[#1e2538] bg-white dark:bg-[#0a0e1a]">
          <div className="px-4 py-3 space-y-4">
            {groups.map((g) => (
              <div key={g.label}>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[#8894a8] mb-2">{g.label}</p>
                <div className="space-y-0.5">
                  {g.links.map((l) => (
                    <Link
                      key={l.href}
                      href={l.href}
                      onClick={() => setOpen(false)}
                      className="block px-3 py-2 rounded-lg text-sm text-[#4a5568] dark:text-[#b8c2d9] hover:bg-[#f1f3f9] dark:hover:bg-[#161b2e]"
                    >
                      {l.label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
