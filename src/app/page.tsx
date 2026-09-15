import Link from "next/link";
import {
  Video, Music, Calculator, Moon, Sprout, LayoutGrid,
  Sparkles, Wand2, Image as ImageIcon, ArrowRight, Zap
} from "lucide-react";
import AgentChat from "@/components/ai/AgentChat";

const tools = [
  { name: "Tạo Ảnh AI", desc: "DALL-E 3 — mô tả bằng tiếng Việt", icon: Wand2, href: "/tools/ai-image", accent: "pink", tag: "New" },
  { name: "Nâng Cấp Ảnh", desc: "WebGPU AI upscaler 2x/4x", icon: ImageIcon, href: "/tools/ai-upscaler", accent: "cyan", tag: "New" },
  { name: "Tải Video", desc: "YouTube & TikTok, không watermark", icon: Video, href: "/tools/video-downloader", accent: "red", tag: "Hot" },
  { name: "Chuyển MP3", desc: "Trích xuất âm thanh chất lượng cao", icon: Music, href: "/tools/mp3-converter", accent: "purple", tag: null },
  { name: "Tính Ngày", desc: "Khoảng cách ngày, tuần, tháng, năm", icon: Calculator, href: "/tools/date-calculator", accent: "blue", tag: null },
  { name: "Lịch Âm", desc: "Âm dương lịch, can chi, con giáp", icon: Moon, href: "/tools/lunar-calendar", accent: "indigo", tag: null },
  { name: "Nông Trại", desc: "Game kéo thả — trồng, tưới, thu hoạch", icon: Sprout, href: "/games/farm", accent: "emerald", tag: "Mới" },
  { name: "Xếp Bài", desc: "Solitaire cổ điển", icon: LayoutGrid, href: "/games/solitaire", accent: "amber", tag: null },
];

const accentMap: Record<string, { bg: string; text: string; ring: string; glow: string }> = {
  pink:    { bg: "bg-pink-50 dark:bg-pink-500/10",       text: "text-pink-600 dark:text-pink-400",       ring: "ring-pink-500/20",    glow: "group-hover:shadow-pink-500/10" },
  cyan:    { bg: "bg-cyan-50 dark:bg-cyan-500/10",       text: "text-cyan-600 dark:text-cyan-400",       ring: "ring-cyan-500/20",    glow: "group-hover:shadow-cyan-500/10" },
  red:     { bg: "bg-red-50 dark:bg-red-500/10",         text: "text-red-600 dark:text-red-400",         ring: "ring-red-500/20",     glow: "group-hover:shadow-red-500/10" },
  purple:  { bg: "bg-purple-50 dark:bg-purple-500/10",   text: "text-purple-600 dark:text-purple-400",   ring: "ring-purple-500/20",  glow: "group-hover:shadow-purple-500/10" },
  blue:    { bg: "bg-blue-50 dark:bg-blue-500/10",       text: "text-blue-600 dark:text-blue-400",       ring: "ring-blue-500/20",    glow: "group-hover:shadow-blue-500/10" },
  indigo:  { bg: "bg-indigo-50 dark:bg-indigo-500/10",   text: "text-indigo-600 dark:text-indigo-400",   ring: "ring-indigo-500/20",  glow: "group-hover:shadow-indigo-500/10" },
  emerald: { bg: "bg-emerald-50 dark:bg-emerald-500/10", text: "text-emerald-600 dark:text-emerald-400", ring: "ring-emerald-500/20", glow: "group-hover:shadow-emerald-500/10" },
  amber:   { bg: "bg-amber-50 dark:bg-amber-500/10",     text: "text-amber-600 dark:text-amber-400",     ring: "ring-amber-500/20",   glow: "group-hover:shadow-amber-500/10" },
};

export default function HomePage() {
  return (
    <main className="min-h-screen">
      {/* ===== HERO — Gọn gàng, tập trung ===== */}
      <section className="pt-16 pb-10 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-2 mb-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#eef2ff] dark:bg-[#1e1b4b] text-indigo-600 dark:text-indigo-400 text-xs font-medium">
              <Zap className="w-3 h-3" strokeWidth={2.5} /> AI Productivity Suite
            </span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-[#0f1729] dark:text-white mb-3">
            Làm mọi thứ với{" "}
            <span className="bg-gradient-to-r from-indigo-500 to-violet-600 bg-clip-text text-transparent">
              một workspace
            </span>
          </h1>
          <p className="text-[15px] text-[#4a5568] dark:text-[#b8c2d9] max-w-xl">
            Tạo ảnh AI, tải video, chuyển đổi định dạng, xem lịch âm và chơi game — tất cả trong một nền tảng duy nhất.
          </p>
        </div>
      </section>

      {/* ===== MAIN CONTENT — Split layout ===== */}
      <section className="px-4 sm:px-6 pb-16">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">

          {/* Left: Tool grid */}
          <div>
            {/* Section header */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-[#0f1729] dark:text-white tracking-tight">
                Công cụ
              </h2>
              <span className="text-xs text-[#8894a8]">{tools.length} tiện ích</span>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {tools.map((t) => {
                const Icon = t.icon;
                const a = accentMap[t.accent];
                return (
                  <Link
                    key={t.name}
                    href={t.href}
                    className={`tool-card group relative flex items-start gap-3.5 p-4 rounded-xl bg-white dark:bg-[#0f1422] border border-[#e8ecf3] dark:border-[#1e2538] hover:border-[#d4dae6] dark:hover:border-[#2a3348] ${a.glow}`}
                  >
                    <div className={`shrink-0 w-10 h-10 rounded-lg ${a.bg} ${a.text} flex items-center justify-center ring-1 ${a.ring}`}>
                      <Icon className="w-5 h-5" strokeWidth={1.75} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="font-medium text-[14px] text-[#0f1729] dark:text-white truncate">
                          {t.name}
                        </h3>
                        {t.tag && (
                          <span className={`shrink-0 text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded ${a.bg} ${a.text}`}>
                            {t.tag}
                          </span>
                        )}
                      </div>
                      <p className="text-[13px] text-[#8894a8] leading-snug line-clamp-2">
                        {t.desc}
                      </p>
                    </div>
                    <ArrowRight className="shrink-0 w-4 h-4 text-[#d4dae6] dark:text-[#2a3348] group-hover:text-[#8894a8] transition-colors mt-1" />
                  </Link>
                );
              })}
            </div>

            {/* Info strip */}
            <div className="mt-6 grid grid-cols-3 gap-3">
              {[
                { k: "Miễn phí", v: "Không giới hạn" },
                { k: "Bảo mật", v: "Không tracking" },
                { k: "Nhanh", v: "WebGPU AI" },
              ].map((s) => (
                <div key={s.k} className="p-3 rounded-xl bg-white dark:bg-[#0f1422] border border-[#e8ecf3] dark:border-[#1e2538] text-center">
                  <p className="text-[11px] uppercase tracking-wider text-[#8894a8] mb-0.5">{s.k}</p>
                  <p className="text-[13px] font-medium text-[#0f1729] dark:text-white">{s.v}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right: AI Chat */}
          <div className="lg:sticky lg:top-20 lg:self-start">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-[#0f1729] dark:text-white tracking-tight">
                Trợ lý AI
              </h2>
              <span className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Online
              </span>
            </div>
            <AgentChat />
          </div>
        </div>
      </section>
    </main>
  );
}
