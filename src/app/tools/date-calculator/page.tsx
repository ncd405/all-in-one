"use client";
import { useState } from "react";
import { Calculator, ArrowRight } from "lucide-react";

export default function Page() {
  const [s, setS] = useState(""); const [e, setE] = useState("");
  const [r, setR] = useState<{days:number;weeks:number;months:number;years:number}|null>(null);

  const calc = () => {
    if (!s || !e) return alert("Chọn cả hai ngày");
    const st = new Date(s), en = new Date(e);
    if (en < st) return alert("Ngày kết thúc phải sau ngày bắt đầu");
    const d = Math.ceil(Math.abs(en.getTime() - st.getTime()) / 86400000);
    setR({ days: d, weeks: Math.floor(d/7), months: (en.getFullYear()-st.getFullYear())*12 + (en.getMonth()-st.getMonth()), years: en.getFullYear()-st.getFullYear() });
  };

  return (
    <main className="min-h-screen py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full text-sm font-medium mb-4"><Calculator className="w-4 h-4" /> Công cụ</div>
          <h1 className="text-4xl font-bold mb-2">Tính Khoảng Cách Ngày</h1>
          <p className="text-gray-600 dark:text-gray-400">Nhập hai ngày để tính chênh lệch.</p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-6 space-y-5 border border-gray-100 dark:border-gray-800">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Ngày bắt đầu</label>
              <input type="date" value={s} onChange={(ev) => setS(ev.target.value)} className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Ngày kết thúc</label>
              <input type="date" value={e} onChange={(ev) => setE(ev.target.value)} className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
            </div>
          </div>
          <button onClick={calc} className="w-full px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg flex items-center justify-center gap-2">Tính toán <ArrowRight className="w-4 h-4" /></button>
          {r && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
              {[{v:r.days,l:"Ngày",c:"blue"},{v:r.weeks,l:"Tuần",c:"green"},{v:r.months,l:"Tháng",c:"purple"},{v:r.years,l:"Năm",c:"amber"}].map((x) => (
                <div key={x.l} className={`bg-${x.c}-50 dark:bg-${x.c}-900/20 p-4 rounded-xl text-center`}>
                  <div className={`text-2xl font-bold text-${x.c}-600`}>{x.v}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">{x.l}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}