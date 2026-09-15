"use client";
import { useState } from "react";
import { Video, Music, Download, Loader2, AlertCircle, CheckCircle2, ExternalLink, Clock } from "lucide-react";

type Format = "video" | "audio";
type Quality = "360p" | "480p" | "720p" | "1080p" | "best";
interface Result { title: string; thumbnail?: string; duration?: number; downloadUrl: string; platform?: string; }

export default function VideoDownloaderPage() {
  const [url, setUrl] = useState("");
  const [format, setFormat] = useState<Format>("video");
  const [quality, setQuality] = useState<Quality>("720p");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<Result | null>(null);

  const go = async () => {
    if (!url.trim()) return setError("Vui lòng nhập URL.");
    setLoading(true); setError(""); setResult(null);
    try {
      const r = await fetch("/api/download", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url, format, quality }) });
      const d = await r.json();
      if (!d.success) throw new Error(d.error);
      setResult(d.data);
    } catch (e: any) { setError(e.message || "Lỗi."); }
    finally { setLoading(false); }
  };

  const fmt = (s?: number) => s ? `${Math.floor(s/60)}:${(s%60).toString().padStart(2,"0")}` : "";

  return (
    <main className="min-h-screen py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full text-sm font-medium mb-4">
            <Video className="w-4 h-4" /> Công cụ
          </div>
          <h1 className="text-4xl font-bold mb-2">Tải Video &amp; MP3</h1>
          <p className="text-gray-600 dark:text-gray-400">Hỗ trợ YouTube và TikTok — không watermark, không giới hạn.</p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-6 space-y-5 border border-gray-100 dark:border-gray-800">
          <div>
            <label className="block text-sm font-medium mb-2">Link video</label>
            <input value={url} onChange={(e) => setUrl(e.target.value)} onKeyDown={(e) => e.key === "Enter" && go()}
              placeholder="https://www.youtube.com/watch?v=..."
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-red-500 focus:outline-none" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Định dạng</label>
              <div className="flex gap-2">
                {(["video","audio"] as const).map((f) => (
                  <button key={f} onClick={() => setFormat(f)}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border-2 transition-all ${format===f ? "border-red-500 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400" : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400"}`}>
                    {f === "video" ? <Video className="w-4 h-4" /> : <Music className="w-4 h-4" />} {f === "video" ? "Video" : "Audio"}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Chất lượng</label>
              <select value={quality} onChange={(e) => setQuality(e.target.value as Quality)} disabled={format === "audio"}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-red-500 focus:outline-none disabled:opacity-50">
                <option value="360p">360p</option><option value="480p">480p</option>
                <option value="720p">720p HD</option><option value="1080p">1080p FHD</option><option value="best">Cao nhất</option>
              </select>
            </div>
          </div>

          <button onClick={go} disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-red-500 to-orange-500 text-white font-medium rounded-xl hover:brightness-110 disabled:opacity-60">
            {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Đang trích xuất...</> : <><Download className="w-5 h-5" /> Tải xuống</>}
          </button>

          {error && <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl"><AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" /><p className="text-sm text-red-700 dark:text-red-300">{error}</p></div>}

          {result && (
            <div className="flex items-start gap-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
              <CheckCircle2 className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-green-700 dark:text-green-300 mb-2">Sẵn sàng tải!</p>
                {result.thumbnail && <img src={result.thumbnail} alt="" className="w-full rounded-lg mb-3" />}
                <p className="text-sm line-clamp-2 mb-2">{result.title}</p>
                {result.duration && <p className="text-xs text-gray-500 flex items-center gap-1 mb-3"><Clock className="w-3 h-3" /> {fmt(result.duration)}</p>}
                <a href={result.downloadUrl} download
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-green-500 hover:bg-green-600 text-white text-sm font-medium rounded-lg">
                  <Download className="w-4 h-4" /> Tải về máy <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          )}

          <p className="text-xs text-gray-500 pt-2 border-t border-gray-200 dark:border-gray-700">⚡ Adrenaline Engine — pure-JS, không cần server phụ trợ.</p>
        </div>
      </div>
    </main>
  );
}