"use client";
import { useState } from "react";
import { Music, Download, Loader2, AlertCircle, CheckCircle2, ExternalLink } from "lucide-react";

export default function Page() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<any>(null);

  const go = async () => {
    if (!url.trim()) return setError("Nhập URL.");
    setLoading(true); setError(""); setResult(null);
    try {
      const r = await fetch("/api/download", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url, format: "audio", quality: "best" }) });
      const d = await r.json();
      if (!d.success) throw new Error(d.error);
      setResult(d.data);
    } catch (e: any) { setError(e.message || "Lỗi."); }
    finally { setLoading(false); }
  };

  return (
    <main className="min-h-screen py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full text-sm font-medium mb-4">
            <Music className="w-4 h-4" /> Công cụ
          </div>
          <h1 className="text-4xl font-bold mb-2">Chuyển sang Audio</h1>
          <p className="text-gray-600 dark:text-gray-400">Trích xuất âm thanh chất lượng cao (.m4a).</p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-6 space-y-5 border border-gray-100 dark:border-gray-800">
          <input value={url} onChange={(e) => setUrl(e.target.value)} onKeyDown={(e) => e.key === "Enter" && go()}
            placeholder="https://www.youtube.com/watch?v=..." className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-purple-500 focus:outline-none" />

          <button onClick={go} disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium rounded-xl hover:brightness-110 disabled:opacity-60">
            {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Đang xử lý...</> : <><Music className="w-5 h-5" /> Trích xuất Audio</>}
          </button>

          {error && <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl"><AlertCircle className="w-5 h-5 text-red-500" /><p className="text-sm text-red-700 dark:text-red-300">{error}</p></div>}

          {result && (
            <div className="flex items-start gap-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
              <CheckCircle2 className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                {result.thumbnail && <img src={result.thumbnail} alt="" className="w-full rounded-lg mb-2" />}
                <p className="text-sm line-clamp-2 mb-3">{result.title}</p>
                <a href={result.downloadUrl} download className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-green-500 hover:bg-green-600 text-white text-sm font-medium rounded-lg">
                  <Download className="w-4 h-4" /> Tải về <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}