"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { Coins, Sprout, RotateCcw, ShoppingCart, Backpack, ScrollText, Gift, X, Lock, Droplets, Scissors } from "lucide-react";

type CropType = "carrot" | "tomato" | "pumpkin" | "corn" | "watermelon";
type ToolType = CropType | "water" | "sickle";
type ModalType = "shop" | "inventory" | "quest" | "reward" | null;
interface CropConfig { name: string; emoji: string; growTime: number; seedCost: number; sellPrice: number; exp: number; levelReq: number; rarity: "common"|"rare"|"epic"; }
interface Plot { id: number; crop: CropType | null; plantedAt: number | null; watered: boolean; }
interface Quest { id: string; name: string; target: number; progress: number; rewardGold: number; rewardExp: number; type: "harvest"|"plant"|"water"; claimed: boolean; }

const CROPS: Record<CropType, CropConfig> = {
  carrot:     { name: "Cà rốt",  emoji: "🥕", growTime: 20000,  seedCost: 5,  sellPrice: 15,  exp: 10,  levelReq: 1, rarity: "common" },
  tomato:     { name: "Cà chua", emoji: "🍅", growTime: 45000,  seedCost: 15, sellPrice: 45,  exp: 25,  levelReq: 1, rarity: "common" },
  pumpkin:    { name: "Bí ngô",  emoji: "🎃", growTime: 90000,  seedCost: 30, sellPrice: 100, exp: 50,  levelReq: 2, rarity: "rare" },
  corn:       { name: "Ngô",     emoji: "🌽", growTime: 60000,  seedCost: 25, sellPrice: 80,  exp: 40,  levelReq: 2, rarity: "rare" },
  watermelon: { name: "Dưa hấu", emoji: "🍉", growTime: 150000, seedCost: 60, sellPrice: 220, exp: 100, levelReq: 3, rarity: "epic" },
};

const NUM_PLOTS = 9;
const STORAGE_KEY = "aio-farm-v1";
const RB: Record<string, string> = { common: "border-gray-400", rare: "border-purple-500", epic: "border-pink-500" };

function expForLvl(l: number) { return 100 * l; }
function newQuests(): Quest[] {
  return [
    { id: "q1", name: "Thu hoạch 5 cây", target: 5, progress: 0, rewardGold: 50, rewardExp: 20, type: "harvest", claimed: false },
    { id: "q2", name: "Trồng 3 cây", target: 3, progress: 0, rewardGold: 30, rewardExp: 15, type: "plant", claimed: false },
    { id: "q3", name: "Tưới 5 lần", target: 5, progress: 0, rewardGold: 40, rewardExp: 20, type: "water", claimed: false },
  ];
}

export default function FarmPage() {
  const [gold, setGold] = useState(150);
  const [level, setLevel] = useState(1);
  const [exp, setExp] = useState(0);
  const [plots, setPlots] = useState<Plot[]>(Array.from({ length: NUM_PLOTS }, (_, i) => ({ id: i, crop: null, plantedAt: null, watered: false })));
  const [selectedTool, setSelectedTool] = useState<ToolType>("carrot");
  const [now, setNow] = useState(Date.now());
  const [toast, setToast] = useState("");
  const [modal, setModal] = useState<ModalType>(null);
  const [inv, setInv] = useState<Record<CropType, number>>({ carrot:0, tomato:0, pumpkin:0, corn:0, watermelon:0 });
  const [quests, setQuests] = useState<Quest[]>(newQuests());
  const [drag, setDrag] = useState<{ active: boolean; tool: ToolType | null; x: number; y: number; hover: number | null }>({ active: false, tool: null, x: 0, y: 0, hover: null });
  const plotRefs = useRef<Record<number, HTMLDivElement | null>>({});

  useEffect(() => {
    try { const s = localStorage.getItem(STORAGE_KEY); if (s) { const d = JSON.parse(s); setGold(d.gold ?? 150); setLevel(d.level ?? 1); setExp(d.exp ?? 0); setPlots(d.plots ?? Array.from({ length: NUM_PLOTS }, (_, i) => ({ id: i, crop: null, plantedAt: null, watered: false }))); setInv(d.inv ?? { carrot:0, tomato:0, pumpkin:0, corn:0, watermelon:0 }); setQuests(d.quests ?? newQuests()); } } catch {}
  }, []);

  useEffect(() => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ gold, level, exp, plots, inv, quests })); } catch {} }, [gold, level, exp, plots, inv, quests]);
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 500); return () => clearInterval(t); }, []);

  const toastMsg = (m: string) => { setToast(m); setTimeout(() => setToast(""), 1800); };
  const addExp = (a: number) => { setExp((p) => { let n = p + a; let l = level; while (n >= expForLvl(l)) { n -= expForLvl(l); l++; } if (l > level) { setLevel(l); setTimeout(() => toastMsg(`🎉 Lên cấp ${l}!`), 400); } return n; }); };
  const updQ = (t: Quest["type"]) => setQuests((prev) => prev.map((q) => q.type === t && !q.claimed ? { ...q, progress: Math.min(q.target, q.progress + 1) } : q));

  const progress = useCallback((p: Plot): number => {
    if (!p.crop || !p.plantedAt) return 0;
    const c = CROPS[p.crop]; const e = now - p.plantedAt; const sp = p.watered ? 1.5 : 1;
    return Math.min(100, (e * sp / c.growTime) * 100);
  }, [now]);

  const ready = (p: Plot) => progress(p) >= 100;

  const doPlant = (id: number, crop: CropType) => {
    const p = plots[id]; if (p.crop) return toastMsg("Ô có cây rồi!");
    const c = CROPS[crop]; if (level < c.levelReq) return toastMsg(`Cần cấp ${c.levelReq}`);
    if (gold < c.seedCost) return toastMsg(`Cần ${c.seedCost} vàng`);
    setGold((g) => g - c.seedCost);
    setPlots((ps) => ps.map((x) => x.id === id ? { ...x, crop, plantedAt: Date.now(), watered: false } : x));
    updQ("plant"); toastMsg(`Đã trồng ${c.name} 🌱`);
  };
  const doWater = (id: number) => {
    const p = plots[id]; if (!p.crop) return toastMsg("Chưa có cây!");
    if (p.watered) return toastMsg("Đã tưới!");
    if (ready(p)) return toastMsg("Cây chín, hãy thu hoạch!");
    setPlots((ps) => ps.map((x) => x.id === id ? { ...x, watered: true } : x));
    updQ("water"); toastMsg("Đã tưới 💧");
  };
  const doHarvest = (id: number) => {
    const p = plots[id]; if (!p.crop || !ready(p)) return toastMsg("Chưa chín!");
    const c = CROPS[p.crop]; setInv((iv) => ({ ...iv, [p.crop!]: iv[p.crop!] + 1 }));
    setPlots((ps) => ps.map((x) => x.id === id ? { ...x, crop: null, plantedAt: null, watered: false } : x));
    updQ("harvest"); toastMsg(`Thu ${c.name} 📦`);
  };

  const findPlot = (x: number, y: number): number | null => {
    for (const [id, el] of Object.entries(plotRefs.current)) { if (!el) continue; const r = el.getBoundingClientRect(); if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) return Number(id); }
    return null;
  };

  const onPointerDown = (e: React.PointerEvent, tool: ToolType) => {
    e.preventDefault();
    setDrag({ active: true, tool, x: e.clientX, y: e.clientY, hover: null });
  };

  useEffect(() => {
    if (!drag.active) return;
    const move = (e: PointerEvent) => setDrag((d) => ({ ...d, x: e.clientX, y: e.clientY, hover: findPlot(e.clientX, e.clientY) }));
    const up = (e: PointerEvent) => {
      const id = findPlot(e.clientX, e.clientY);
      if (id !== null && drag.tool) {
        if (drag.tool === "water") doWater(id);
        else if (drag.tool === "sickle") doHarvest(id);
        else doPlant(id, drag.tool);
      }
      setDrag({ active: false, tool: null, x: 0, y: 0, hover: null });
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); };
  }, [drag.active, drag.tool, plots, gold, level]);

  const sell = (c: CropType) => { if (inv[c] <= 0) return; const cfg = CROPS[c]; setInv((i) => ({ ...i, [c]: i[c] - 1 })); setGold((g) => g + cfg.sellPrice); addExp(cfg.exp); toastMsg(`Bán ${cfg.name} +${cfg.sellPrice}💰`); };
  const claim = (id: string) => { const q = quests.find((x) => x.id === id); if (!q || q.claimed || q.progress < q.target) return; setGold((g) => g + q.rewardGold); addExp(q.rewardExp); setQuests((p) => p.map((x) => x.id === id ? { ...x, claimed: true } : x)); toastMsg("Đã nhận thưởng!"); };
  const reset = () => { if (!confirm("Chơi lại?")) return; setGold(150); setLevel(1); setExp(0); setPlots(Array.from({ length: NUM_PLOTS }, (_, i) => ({ id: i, crop: null, plantedAt: null, watered: false }))); setInv({ carrot:0, tomato:0, pumpkin:0, corn:0, watermelon:0 }); setQuests(newQuests()); localStorage.removeItem(STORAGE_KEY); };

  const expNeed = expForLvl(level);
  const emoji = (t: ToolType) => t === "water" ? "💧" : t === "sickle" ? "✂️" : CROPS[t].emoji;

  return (
    <main className="min-h-screen bg-gradient-to-b from-sky-300 via-green-200 to-emerald-300 relative overflow-hidden select-none touch-none">
      <div className="absolute inset-0 pointer-events-none"><div className="absolute top-10 left-10 text-6xl opacity-40">☁️</div><div className="absolute top-20 right-20 text-5xl opacity-40">☁️</div></div>

      {/* HUD */}
      <div className="relative z-10 p-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-3 bg-gradient-to-br from-amber-600 to-yellow-700 rounded-2xl p-2 pr-4 shadow-xl border-2 border-yellow-300">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold text-lg border-2 border-yellow-200">{level}</div>
            <div className="min-w-[120px]">
              <div className="text-xs text-yellow-100 font-bold">Trang trại</div>
              <div className="h-2 bg-amber-900/50 rounded-full overflow-hidden mt-1"><div className="h-full bg-gradient-to-r from-yellow-300 to-lime-400 transition-all" style={{ width: `${(exp / expNeed) * 100}%` }} /></div>
              <div className="text-[10px] text-yellow-100 mt-0.5">{exp}/{expNeed} XP</div>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-gradient-to-br from-yellow-500 to-amber-600 rounded-2xl px-4 py-2 shadow-xl border-2 border-yellow-300">
            <Coins className="w-5 h-5 text-white" /><span className="text-white font-bold text-lg">{gold.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Main */}
      <div className="relative z-10 max-w-5xl mx-auto px-3 pb-40 flex gap-3">
        <div className="flex-1 flex items-center justify-center py-4">
          <div className="grid grid-cols-3 gap-3 md:gap-4" style={{ transform: "perspective(1200px) rotateX(35deg) rotateZ(-30deg)" }}>
            {plots.map((p) => {
              const pr = progress(p); const r = ready(p); const c = p.crop ? CROPS[p.crop] : null;
              const hv = drag.active && drag.hover === p.id;
              const canDrop = hv && drag.tool && ((drag.tool === "water" && p.crop && !p.watered && !r) || (drag.tool === "sickle" && p.crop && r) || (drag.tool !== "water" && drag.tool !== "sickle" && !p.crop));
              return (
                <div key={p.id} ref={(el) => { plotRefs.current[p.id] = el; }}
                  className={`w-20 h-20 md:w-24 md:h-24 rounded-xl border-4 transition-all relative ${p.crop ? "bg-gradient-to-br from-amber-700 to-amber-900 border-amber-950" : "bg-gradient-to-br from-amber-600 to-amber-800 border-amber-950"} ${r ? "ring-4 ring-yellow-400 animate-pulse" : ""} ${hv ? (canDrop ? "ring-4 ring-green-400 scale-110" : "ring-4 ring-red-400") : ""}`}>
                  <div className="absolute inset-2 rounded-lg bg-amber-950/30 flex flex-col items-center justify-center">
                    {!p.crop ? <Sprout className="w-6 h-6 text-amber-200/60" /> : r ? <div className="text-4xl md:text-5xl" style={{ transform: "rotateZ(30deg)" }}>{c!.emoji}</div> : (
                      <div style={{ transform: "rotateZ(30deg)" }} className="flex flex-col items-center">
                        <div className="text-2xl">{pr < 30 ? "🌱" : pr < 70 ? "🌿" : "🌾"}</div>
                        <div className="w-12 md:w-14 h-1.5 bg-black/30 rounded-full mt-1 overflow-hidden"><div className="h-full bg-green-400 transition-all" style={{ width: `${pr}%` }} /></div>
                        {p.watered && <div className="text-[10px] text-blue-300 mt-0.5">💧</div>}
                      </div>
                    )}
                  </div>
                  {r && <div className="absolute -top-2 -right-2 w-7 h-7 bg-yellow-400 rounded-full border-2 border-yellow-200 flex items-center justify-center text-xs font-bold text-yellow-900 animate-bounce">!</div>}
                </div>
              );
            })}
          </div>
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-2 pt-8">
          <SideBtn icon={<ShoppingCart className="w-6 h-6" />} badge={null} onClick={() => setModal("shop")} title="Cửa hàng" />
          <SideBtn icon={<Backpack className="w-6 h-6" />} badge={Object.values(inv).reduce((a, b) => a + b, 0) || null} onClick={() => setModal("inventory")} title="Kho" />
          <SideBtn icon={<ScrollText className="w-6 h-6" />} badge={quests.filter((q) => q.progress >= q.target && !q.claimed).length || null} onClick={() => setModal("quest")} title="Nhiệm vụ" />
          <SideBtn icon={<Gift className="w-6 h-6" />} badge="!" onClick={() => setModal("reward")} title="Thưởng" />
          <button onClick={reset} className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br from-gray-500 to-gray-700 border-2 border-gray-300 flex items-center justify-center text-white shadow-xl hover:scale-105 transition" title="Chơi lại"><RotateCcw className="w-6 h-6" /></button>
        </div>
      </div>

      <div className="fixed bottom-36 left-1/2 -translate-x-1/2 z-10 text-xs text-amber-900 bg-yellow-200/70 px-3 py-1 rounded-full backdrop-blur">👆 Kéo công cụ xuống ô đất để dùng</div>

      {/* Toolbar */}
      <div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-20">
        <div className="flex gap-2 bg-gradient-to-b from-amber-800 to-amber-900 rounded-2xl p-2 shadow-2xl border-2 border-yellow-400">
          {(Object.keys(CROPS) as CropType[]).map((k) => {
            const c = CROPS[k]; const locked = level < c.levelReq; const sel = selectedTool === k;
            return (
              <button key={k} onPointerDown={(e) => !locked && onPointerDown(e, k)} onClick={() => !locked && setSelectedTool(k)}
                className={`w-14 h-14 md:w-16 md:h-16 rounded-xl border-2 transition-all flex flex-col items-center justify-center touch-none ${locked ? "bg-gray-700 border-gray-500 opacity-60" : sel ? "bg-gradient-to-br from-yellow-400 to-orange-500 border-yellow-200 scale-105" : "bg-amber-700 border-amber-500 hover:scale-105"}`}>
                <div className="text-xl md:text-2xl">{locked ? <Lock className="w-5 h-5 text-gray-300" /> : c.emoji}</div>
                {!locked && <div className="text-[9px] text-white font-bold mt-0.5">{c.seedCost}💰</div>}
              </button>
            );
          })}
          <button onPointerDown={(e) => onPointerDown(e, "water")} onClick={() => setSelectedTool("water")}
            className={`w-14 h-14 md:w-16 md:h-16 rounded-xl border-2 flex flex-col items-center justify-center touch-none ${selectedTool === "water" ? "bg-gradient-to-br from-blue-400 to-cyan-500 border-blue-200 scale-105" : "bg-blue-600 border-blue-400 hover:scale-105"}`}>
            <Droplets className="w-6 h-6 text-white" /><div className="text-[9px] text-white font-bold mt-0.5">Tưới</div>
          </button>
          <button onPointerDown={(e) => onPointerDown(e, "sickle")} onClick={() => setSelectedTool("sickle")}
            className={`w-14 h-14 md:w-16 md:h-16 rounded-xl border-2 flex flex-col items-center justify-center touch-none ${selectedTool === "sickle" ? "bg-gradient-to-br from-red-400 to-rose-500 border-red-200 scale-105" : "bg-rose-600 border-rose-400 hover:scale-105"}`}>
            <Scissors className="w-6 h-6 text-white" /><div className="text-[9px] text-white font-bold mt-0.5">Thu</div>
          </button>
        </div>
      </div>

      {/* Drag ghost */}
      {drag.active && drag.tool && (
        <div className="fixed pointer-events-none z-50 text-5xl" style={{ left: drag.x, top: drag.y, transform: "translate(-50%,-50%)", filter: "drop-shadow(0 0 10px rgba(255,255,255,0.9))" }}>{emoji(drag.tool)}</div>
      )}

      {/* Toast */}
      {toast && <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 px-6 py-3 bg-gray-900/95 text-white rounded-xl shadow-2xl text-sm font-medium animate-bounce">{toast}</div>}

      {/* Modals */}
      {modal && (
        <div className="fixed inset-0 bg-black/60 z-40 flex items-center justify-center p-4" onClick={() => setModal(null)}>
          <div className="bg-gradient-to-br from-amber-100 to-yellow-100 rounded-3xl shadow-2xl border-4 border-yellow-600 max-w-lg w-full max-h-[80vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-amber-700 to-amber-900 p-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-yellow-100">{modal === "shop" ? "Cửa hàng" : modal === "inventory" ? "Kho" : modal === "quest" ? "Nhiệm vụ" : "Phần thưởng"}</h2>
              <button onClick={() => setModal(null)} className="w-8 h-8 rounded-full bg-yellow-200/20 text-yellow-100 flex items-center justify-center"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[calc(80vh-80px)]">
              {modal === "shop" && (
                <div className="grid grid-cols-2 gap-3">
                  {(Object.keys(CROPS) as CropType[]).map((k) => {
                    const c = CROPS[k]; const locked = level < c.levelReq;
                    return (
                      <div key={k} className={`rounded-xl p-3 border-2 ${RB[c.rarity]} bg-white/80 relative`}>
                        {locked && <div className="absolute inset-0 bg-black/60 rounded-xl flex items-center justify-center text-white text-xs font-bold"><Lock className="w-4 h-4 mr-1" /> Cấp {c.levelReq}</div>}
                        <div className="text-4xl text-center">{c.emoji}</div>
                        <div className="text-center font-bold text-sm">{c.name}</div>
                        <div className="flex justify-between text-xs mt-2"><span className="text-red-600 font-bold">{c.seedCost}💰</span><span className="text-green-600 font-bold">{c.sellPrice}💰</span></div>
                        <button disabled={locked} onClick={() => { if (gold < c.seedCost) return toastMsg("Không đủ vàng"); setGold((g) => g - c.seedCost); setInv((i) => ({ ...i, [k]: i[k] + 1 })); toastMsg(`Mua ${c.name}!`); }}
                          className="w-full mt-2 py-1.5 bg-gradient-to-br from-green-500 to-emerald-600 text-white text-xs font-bold rounded-lg disabled:opacity-50">Mua</button>
                      </div>
                    );
                  })}
                </div>
              )}
              {modal === "inventory" && (
                <div>
                  {Object.values(inv).every((v) => v === 0) ? <div className="text-center py-12 text-gray-500"><Backpack className="w-12 h-12 mx-auto mb-2 opacity-30" /><p>Kho trống.</p></div> : (
                    <div className="grid grid-cols-2 gap-3">
                      {(Object.keys(inv) as CropType[]).map((k) => { if (inv[k] === 0) return null; const c = CROPS[k]; return (
                        <div key={k} className={`rounded-xl p-3 border-2 ${RB[c.rarity]} bg-white/80`}>
                          <div className="text-4xl text-center">{c.emoji}</div>
                          <div className="text-center font-bold text-sm">{c.name}</div>
                          <div className="text-center text-xs">SL: <b className="text-purple-600">{inv[k]}</b></div>
                          <button onClick={() => sell(k)} className="w-full mt-2 py-1.5 bg-gradient-to-br from-yellow-400 to-amber-500 text-amber-900 text-xs font-bold rounded-lg">Bán (+{c.sellPrice}💰)</button>
                        </div>
                      ); })}
                    </div>
                  )}
                </div>
              )}
              {modal === "quest" && (
                <div className="space-y-3">
                  {quests.map((q) => { const d = q.progress >= q.target; return (
                    <div key={q.id} className="bg-white/80 rounded-xl p-3 border-2 border-amber-300">
                      <div className="flex justify-between mb-2"><div><div className="font-bold text-sm">{q.name}</div><div className="text-xs text-gray-500">{q.progress}/{q.target}</div></div>
                        <div className="text-xs text-right"><div className="text-yellow-600 font-bold">+{q.rewardGold}💰</div><div className="text-purple-600 font-bold">+{q.rewardExp}⭐</div></div></div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden mb-2"><div className="h-full bg-gradient-to-r from-green-400 to-emerald-500" style={{ width: `${(q.progress / q.target) * 100}%` }} /></div>
                      <button disabled={!d || q.claimed} onClick={() => claim(q.id)} className={`w-full py-1.5 rounded-lg text-xs font-bold ${q.claimed ? "bg-gray-300 text-gray-500" : d ? "bg-gradient-to-br from-green-500 to-emerald-600 text-white" : "bg-gray-200 text-gray-400"}`}>{q.claimed ? "Đã nhận" : d ? "Nhận thưởng" : "Chưa xong"}</button>
                    </div>
                  ); })}
                </div>
              )}
              {modal === "reward" && (
                <div className="text-center py-6">
                  <div className="text-6xl mb-3">🎁</div>
                  <h3 className="font-bold text-lg mb-1">Nhận 50 vàng miễn phí!</h3>
                  <button onClick={() => { setGold((g) => g + 50); toastMsg("+50 vàng 💰"); setModal(null); }} className="mt-4 px-6 py-2 bg-gradient-to-br from-yellow-400 to-amber-500 text-amber-900 font-bold rounded-xl">Nhận ngay</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function SideBtn({ icon, badge, onClick, title }: { icon: React.ReactNode; badge: number | string | null; onClick: () => void; title: string }) {
  return (
    <button onClick={onClick} title={title} className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-yellow-700 border-2 border-yellow-300 flex items-center justify-center text-white shadow-xl hover:scale-105 transition relative">
      {icon}
      {badge !== null && <div className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 bg-red-500 rounded-full border-2 border-white text-white text-[10px] font-bold flex items-center justify-center">{badge}</div>}
    </button>
  );
}