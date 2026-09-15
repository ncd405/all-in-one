import Link from "next/link";
import { Video, Music, Calculator, Moon, Sprout, LayoutGrid, Sparkles, Zap, Shield, Infinity as Inf } from "lucide-react";
import AgentChat from "@/components/ai/AgentChat";

const tools = [
  { name: "Tải Video",   desc: "YouTube, TikTok — không watermark", icon: Video,       href: "/tools/video-downloader", gradient: "from-red-500 to-orange-500",   tag: "Hot" },
  { name: "Chuyển MP3",  desc: "Trích xuất âm thanh chất lượng cao", icon: Music,       href: "/tools/mp3-converter",    gradient: "from-purple-500 to-pink-500",  tag: null },
  { name: "Tính Ngày",   desc: "Khoảng cách ngày, tuần, tháng, năm", icon: Calculator,  href: "/tools/date-calculator",  gradient: "from-blue-500 to-cyan-500",    tag: null },
  { name: "Lịch Âm",     desc: "Âm dương lịch, can chi, con giáp",   icon: Moon,        href: "/tools/lunar-calendar",   gradient: "from-indigo-500 to-purple-600", tag: null },
  { name: "Nông Trại",   desc: "Game kéo thả — trồng, tưới, thu hoạch", icon: Sprout,   href: "/games/farm",             gradient: "from-green-500 to-emerald-600", tag: "Mới" },
  { name: "Xếp Bài",     desc: "Solitaire cổ điển",                  icon: LayoutGrid,  href: "/games/solitaire",        gradient: "from-amber-500 to-red-500",    tag: null },
];

const features = [
  { icon: Zap,      title: "Adrenaline Engine", desc: "Pure-JS extraction — không cần server phụ trợ." },
  { icon: Shield,   title: "Bảo mật & Riêng tư", desc: "Không theo dõi, không lưu dữ liệu người dùng." },
  { icon: Inf,      title: "Miễn phí mãi mãi",   desc: "Không giới hạn, không quảng cáo, không đăng ký." },
];

export default function HomePage() {
  return (
    <main className="min-h-screen">
      {/* HERO */}
      <section className="relative text-center py-20 px-4 overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 dark:from-indigo-950/40 dark:via-purple-950/30 dark:to-pink-950/40" />
        <div className="absolute inset-0 -z-10 opacity-30">
          <div className="absolute top-10 left-10 w-40 h-40 rounded-full bg-indigo-400/40 blur-3xl" />
          <div className="absolute bottom-10 right-10 w-60 h-60 rounded-full bg-pink-400/40 blur-3xl" />
        </div>

        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/70 dark:bg-gray-900/70 backdrop-blur border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 rounded-full text-sm font-medium mb-6">
          <Sparkles className="w-4 h-4" /> Được hỗ trợ bởi AI Agent
        </div>
        <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent mb-4">
          ALL IN ONE
        </h1>
        <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-8">
          Tất cả công cụ và trò chơi bạn cần — trong một website duy nhất.
        </p>
      </section>

      {/* FEATURES */}
      <section className="max-w-7xl mx-auto px-4 -mt-8 mb-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.title} className="bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-800">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center mb-3">
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-semibold mb-1">{f.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* GRID + AI */}
      <section className="max-w-7xl mx-auto px-4 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {tools.map((t) => {
              const Icon = t.icon;
              return (
                <Link
                  key={t.name}
                  href={t.href}
                  className="group relative overflow-hidden rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] border border-gray-100 dark:border-gray-800"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${t.gradient} opacity-0 group-hover:opacity-10 transition-opacity`} />
                  {t.tag && (
                    <span className={`absolute top-4 right-4 text-[10px] font-bold px-2 py-1 rounded-full bg-gradient-to-r ${t.gradient} text-white uppercase tracking-wider`}>
                      {t.tag}
                    </span>
                  )}
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${t.gradient} flex items-center justify-center mb-4 relative z-10 group-hover:scale-110 transition-transform`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-lg font-semibold mb-1 relative z-10">{t.name}</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 relative z-10">{t.desc}</p>
                </Link>
              );
            })}
          </div>
          <div className="lg:col-span-1">
            <AgentChat />
          </div>
        </div>
      </section>
    </main>
  );
}