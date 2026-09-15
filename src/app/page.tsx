"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Palette, Image as ImageIcon, Film, Video, Mic, Music,
  ArrowRight, ArrowUpRight, Sparkles, Loader2
} from "lucide-react";

const tabs = [
  { id: "image", label: "Tạo Ảnh", icon: Palette, href: "/tools/ai-image" },
  { id: "upscale", label: "Nâng Cấp", icon: ImageIcon, href: "/tools/ai-upscaler" },
  { id: "video", label: "Tải Video", icon: Film, href: "/tools/video-downloader" },
  { id: "convert", label: "Chuyển MP3", icon: Music, href: "/tools/mp3-converter" },
  { id: "date", label: "Tính Ngày", icon: Mic, href: "/tools/date-calculator" },
  { id: "lunar", label: "Lịch Âm", icon: Video, href: "/tools/lunar-calendar" },
];

// Mockup preview cho từng tab
function TabPreview({ tab }: { tab: string }) {
  if (tab === "image") {
    return (
      <div className="w-full max-w-md mx-auto bg-white rounded-2xl p-6 shadow-2xl">
        <p className="text-[11px] text-gray-400 mb-1">Prompt 4 / 7</p>
        <p className="text-sm font-semibold text-black mb-3">Mô tả ảnh bạn muốn tạo?</p>
        <div className="space-y-2">
          {["Chú mèo phi hành gia uống cà phê", "Thành phố tương lai với cây xanh", "Chợ nổi miền Tây hoàng hôn"].map((t, i) => (
            <div key={i} className={`flex items-center gap-2.5 p-2.5 rounded-lg border text-xs ${i === 0 ? "border-[#22d3ee] bg-cyan-50" : "border-gray-200"}`}>
              <span className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold ${i === 0 ? "bg-[#22d3ee] text-black" : "bg-gray-100 text-gray-500"}`}>{i+1}</span>
              <span className={i === 0 ? "text-black font-medium" : "text-gray-500"}>{t}</span>
            </div>
          ))}
        </div>
        <button className="w-full mt-3 py-2 rounded-lg bg-[#22d3ee] text-black text-xs font-bold">
          Tạo ảnh ngay
        </button>
      </div>
    );
  }
  if (tab === "upscale") {
    return (
      <div className="w-full max-w-md mx-auto bg-white rounded-2xl p-6 shadow-2xl">
        <p className="text-[11px] text-gray-400 mb-1">Nâng cấp ảnh</p>
        <p className="text-sm font-semibold text-black mb-3">Chọn tỷ lệ 2x hoặc 4x</p>
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="aspect-square rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 text-xs">Ảnh gốc</div>
          <div className="aspect-square rounded-lg bg-cyan-50 border-2 border-[#22d3ee] flex items-center justify-center text-[#22d3ee] text-xs font-bold">2x ✨</div>
        </div>
        <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
          <div className="w-2/3 h-full bg-[#22d3ee]" />
        </div>
      </div>
    );
  }
  if (tab === "video") {
    return (
      <div className="w-full max-w-md mx-auto bg-white rounded-2xl p-6 shadow-2xl">
        <p className="text-[11px] text-gray-400 mb-1">Tải video</p>
        <p className="text-sm font-semibold text-black mb-3">Dán link YouTube hoặc TikTok</p>
        <div className="p-2.5 rounded-lg bg-gray-50 border border-gray-200 text-xs text-gray-500 mb-3">
          youtube.com/watch?v=...
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="p-2 rounded-lg border-2 border-[#22d3ee] bg-cyan-50 text-center text-xs font-bold text-[#22d3ee]">Video</div>
          <div className="p-2 rounded-lg border border-gray-200 text-center text-xs text-gray-500">MP3</div>
        </div>
      </div>
    );
  }
  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-2xl p-6 shadow-2xl text-center">
      <Loader2 className="w-8 h-8 animate-spin text-[#22d3ee] mx-auto mb-3" />
      <p className="text-sm text-gray-500">Công cụ đang tải...</p>
    </div>
  );
}

export default function HomePage() {
  const [activeTab, setActiveTab] = useState("image");
  const activeHref = tabs.find(t => t.id === activeTab)?.href || "/tools/ai-image";

  return (
    <main className="min-h-screen bg-[#0a0a0b]">
      {/* ===== HERO ===== */}
      <section className="pt-20 pb-12 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto text-center">
          {/* Badge */}
          <Link
            href="/tools/ai-image"
            className="inline-flex items-center gap-2 px-1 py-1 pr-4 rounded-full border border-[#3a3a40] bg-[#141416] hover:border-[#22d3ee] transition-colors mb-8"
          >
            <span className="px-3 py-1 rounded-full bg-[#22d3ee] text-black text-xs font-bold">
              New
            </span>
            <span className="text-sm text-white">Giới thiệu AI Agent</span>
            <ArrowUpRight className="w-4 h-4 text-[#a1a1a6]" />
          </Link>

          {/* Heading */}
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-black tracking-tight leading-[1.05] mb-6">
            <span className="text-white">Your AI toolkit,</span>
            <br />
            <span className="text-[#22d3ee]">on demand</span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-[#a1a1a6] max-w-2xl mx-auto leading-relaxed mb-10">
            Chỉ cần một câu lệnh. AI Agent sẽ lên kế hoạch, chọn đúng công cụ và trả về ảnh, video, audio, tiện ích, trò chơi — sẵn sàng sử dụng ngay.
          </p>

          {/* CTA */}
          <Link
            href="/tools/ai-image"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-[#22d3ee] text-black font-semibold text-base hover:bg-[#06b6d4] transition-all hover:scale-105"
          >
            Bắt đầu ngay <ArrowRight className="w-5 h-5" strokeWidth={2.5} />
          </Link>
        </div>
      </section>

      {/* ===== SHOWCASE CARD với TAB BAR ===== */}
      <section className="px-4 sm:px-6 pb-20">
        <div className="max-w-5xl mx-auto">
          <div className="card-dark p-4 sm:p-6 md:p-10">

            {/* Tab bar — signature của designs.ai */}
            <div className="flex items-center justify-center gap-1 sm:gap-2 mb-8 flex-wrap">
              {tabs.map((t) => {
                const Icon = t.icon;
                const active = activeTab === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setActiveTab(t.id)}
                    className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center transition-all ${
                      active
                        ? "bg-white text-black shadow-xl scale-105"
                        : "text-[#71717a] hover:text-white hover:bg-[#1a1a1c]"
                    }`}
                    title={t.label}
                  >
                    <Icon className="w-5 h-5" strokeWidth={active ? 2.25 : 1.75} />
                  </button>
                );
              })}
            </div>

            {/* Preview area */}
            <div className="bg-[#0a0a0b] rounded-2xl border border-[#26262a] p-6 sm:p-12 min-h-[380px] flex items-center justify-center">
              <TabPreview tab={activeTab} />
            </div>

            {/* Bottom CTA of card */}
            <div className="mt-6 flex justify-center">
              <Link
                href={activeHref}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#141416] border border-[#3a3a40] text-white text-sm font-medium hover:border-[#22d3ee] transition-colors"
              >
                Mở {tabs.find(t => t.id === activeTab)?.label}
                <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FEATURE CARDS ===== */}
      <section className="px-4 sm:px-6 pb-20">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1 */}
          <div className="card-dark p-8">
            <div className="bg-white rounded-2xl p-5 mb-6 aspect-[4/3] flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-50 via-white to-blue-50" />
              <div className="relative grid grid-cols-2 gap-3 w-full max-w-xs">
                {[0,1,2,3].map(i => (
                  <div key={i} className="aspect-square rounded-lg bg-white border border-gray-200 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-[#22d3ee]" />
                  </div>
                ))}
              </div>
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">Mọi công cụ, một nơi</h3>
            <p className="text-[#a1a1a6] leading-relaxed">
              Từ tạo ảnh AI, nâng cấp ảnh, tải video đến tiện ích hàng ngày — tất cả được thiết kế để phối hợp với nhau trong cùng một workspace.
            </p>
          </div>

          {/* Card 2 */}
          <div className="card-dark p-8">
            <div className="bg-white rounded-2xl p-5 mb-6 aspect-[4/3] flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-white via-cyan-50 to-teal-50" />
              <div className="relative w-full max-w-xs space-y-2">
                <div className="flex items-center gap-2 p-2 rounded-lg bg-white border border-gray-200">
                  <div className="w-6 h-6 rounded-full bg-[#22d3ee]" />
                  <div className="flex-1 h-2 rounded bg-gray-100" />
                </div>
                <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 border border-gray-100">
                  <div className="w-6 h-6 rounded-full bg-gray-200" />
                  <div className="flex-1 h-2 rounded bg-gray-100" />
                </div>
                <div className="ml-4 flex items-center gap-2 p-2 rounded-lg bg-cyan-50 border border-[#22d3ee]/30">
                  <Sparkles className="w-4 h-4 text-[#22d3ee]" />
                  <div className="flex-1 h-2 rounded bg-[#22d3ee]/30" />
                </div>
              </div>
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">AI Agent thông minh</h3>
            <p className="text-[#a1a1a6] leading-relaxed">
              Chat trực tiếp với AI để được hướng dẫn sử dụng công cụ, gợi ý prompt, hoặc tự động chọn công cụ phù hợp với nhu cầu của bạn.
            </p>
          </div>
        </div>
      </section>

      {/* ===== CTA CUỐI ===== */}
      <section className="px-4 sm:px-6 pb-20">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 tracking-tight">
            Sẵn sàng bắt đầu?
          </h2>
          <p className="text-[#a1a1a6] mb-8">
            Miễn phí. Không quảng cáo. Không cần đăng ký.
          </p>
          <Link
            href="/tools/ai-image"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-[#22d3ee] text-black font-semibold hover:bg-[#06b6d4] transition-all hover:scale-105"
          >
            Tạo ảnh AI đầu tiên <ArrowRight className="w-5 h-5" strokeWidth={2.5} />
          </Link>
        </div>
      </section>
    </main>
  );
}
