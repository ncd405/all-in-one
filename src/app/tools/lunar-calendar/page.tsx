"use client";
import { useState, useEffect } from "react";
import { Moon } from "lucide-react";
import solarLunar from "solarlunar";

export default function Page() {
  const [d, setD] = useState(new Date().toISOString().split("T")[0]);
  const [info, setInfo] = useState<any>(null);

  useEffect(() => {
    if (d) {
      const [y, m, day] = d.split("-").map(Number);
      try { setInfo(solarLunar.solar2lunar(y, m, day)); } catch (e) { console.error(e); }
    }
  }, [d]);

  return (
    <main className="min-h-screen py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full text-sm font-medium mb-4"><Moon className="w-4 h-4" /> Công cụ</div>
          <h1 className="text-4xl font-bold mb-2">Xem Lịch Âm Dương</h1>
          <p className="text-gray-600 dark:text-gray-400">Chọn ngày dương để xem âm lịch tương ứng.</p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-6 space-y-5 border border-gray-100 dark:border-gray-800">
          <div>
            <label className="block text-sm font-medium mb-2">Chọn ngày dương</label>
            <input type="date" value={d} onChange={(e) => setD(e.target.value)} className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
          </div>
          {info && (
            <div className="bg-indigo-50 dark:bg-indigo-900/20 p-6 rounded-xl space-y-3">
              <h3 className="text-xl font-semibold text-indigo-700 dark:text-indigo-300">Kết quả</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><p className="text-sm text-gray-600 dark:text-gray-400">Ngày âm:</p><p className="text-lg font-medium">{info.lunarDay}/{info.lunarMonth}/{info.lunarYear}</p></div>
                <div><p className="text-sm text-gray-600 dark:text-gray-400">Can chi:</p><p className="text-lg font-medium">{info.gzYear} {info.gzMonth} {info.gzDay}</p></div>
                <div><p className="text-sm text-gray-600 dark:text-gray-400">Con giáp:</p><p className="text-lg font-medium">{info.animal}</p></div>
                <div><p className="text-sm text-gray-600 dark:text-gray-400">Tháng âm:</p><p className="text-lg font-medium">{info.isLeap ? "Nhuận " : ""}{info.lunarMonth}</p></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}