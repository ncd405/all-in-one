"use client";
import { useState, useEffect } from "react";
import { RotateCcw } from "lucide-react";

type Card = { suit: string; rank: string; color: string; faceUp: boolean };
const suits = ["♠","♥","♦","♣"]; const ranks = ["A","2","3","4","5","6","7","8","9","10","J","Q","K"];

function deck(): Card[] {
  const d: Card[] = [];
  for (const s of suits) for (const r of ranks) d.push({ suit: s, rank: r, color: s==="♥"||s==="♦"?"red":"black", faceUp: false });
  for (let i = d.length-1; i > 0; i--) { const j = Math.floor(Math.random()*(i+1)); [d[i],d[j]] = [d[j],d[i]]; }
  return d;
}

export default function Page() {
  const [d, setD] = useState<Card[]>([]);
  const [cols, setCols] = useState<Card[][]>([]);
  const [sel, setSel] = useState<{c:number;i:number}|null>(null);
  const [msg, setMsg] = useState("");

  const init = () => {
    const dk = deck(); const c: Card[][] = Array.from({ length: 7 }, () => []);
    let k = 0;
    for (let i = 0; i < 7; i++) for (let j = i; j < 7; j++) { const card = dk[k]; card.faceUp = j === i; c[j].push(card); k++; }
    setD(dk.slice(k)); setCols(c); setSel(null); setMsg("");
  };
  useEffect(init, []);

  const click = (c: number, i: number) => {
    if (!cols[c][i]?.faceUp) return;
    if (sel) {
      const mv = cols[sel.c].slice(sel.i); const tgt = cols[c]; const last = tgt[tgt.length-1];
      if (sel.c === c && sel.i === i) { setSel(null); return; }
      if (!last) { if (mv[0].rank === "K") move(sel.c, sel.i, c); else setMsg("Chỉ đặt K lên cột trống"); }
      else if (mv[0].color !== last.color && ranks.indexOf(mv[0].rank) === ranks.indexOf(last.rank)-1) move(sel.c, sel.i, c);
      else setMsg("Không thể di chuyển");
      setSel(null);
    } else setSel({ c, i });
  };
  const move = (f: number, i: number, t: number) => {
    const cc = cols.map(x => [...x]); const m = cc[f].splice(i);
    if (cc[f].length > 0) cc[f][cc[f].length-1].faceUp = true;
    cc[t] = [...cc[t], ...m]; setCols(cc); setMsg("");
  };
  const draw = () => {
    if (d.length === 0) return setMsg("Hết bài");
    const dk = [...d]; const card = dk.pop()!; card.faceUp = true;
    const cc = cols.map(x => [...x]); cc[0] = [...cc[0], card];
    setD(dk); setCols(cc);
  };

  return (
    <main className="min-h-screen bg-green-900 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white">Solitaire</h1>
          <button onClick={init} className="px-4 py-2 bg-white text-green-900 rounded-lg flex items-center gap-2 hover:bg-gray-200"><RotateCcw className="w-4 h-4" /> Chơi lại</button>
        </div>
        {msg && <div className="mb-4 p-3 bg-red-500 text-white rounded-lg">{msg}</div>}
        <div className="grid grid-cols-7 gap-2">
          {cols.map((col, ci) => (
            <div key={ci} className="space-y-1 min-h-[150px]">
              {col.map((card, idx) => (
                <div key={idx} onClick={() => click(ci, idx)} className={`h-16 rounded-lg shadow cursor-pointer transition-transform ${card.faceUp ? "bg-white" : "bg-blue-800"} ${sel?.c===ci && sel?.i===idx ? "ring-4 ring-yellow-400 -translate-y-2" : ""}`}>
                  {card.faceUp && <div className={`p-1 text-sm font-semibold ${card.color==="red"?"text-red-600":"text-black"}`}>{card.rank} {card.suit}</div>}
                </div>
              ))}
              {col.length === 0 && <div className="h-16 rounded-lg border-2 border-dashed border-white/30 flex items-center justify-center text-white/50 text-xs">Trống</div>}
            </div>
          ))}
        </div>
        <div className="mt-6 flex justify-center">
          <button onClick={draw} className="px-6 py-2 bg-white text-green-900 rounded-lg hover:bg-gray-200">Rút bài ({d.length})</button>
        </div>
      </div>
    </main>
  );
}