"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Coins, RotateCcw, ShoppingCart, Backpack, ScrollText, Gift,
  X, Lock, Droplets, Scissors, Sparkles, Star, Zap
} from "lucide-react";

// ==================== TYPES ====================
type CropType = "carrot" | "tomato" | "corn" | "pumpkin" | "watermelon";
type ToolType = CropType | "water" | "sickle";
type ModalType = "shop" | "inventory" | "quest" | "reward" | "levelup" | null;

interface CropConfig {
  name: string; emoji: string; growTime: number;
  seedCost: number; sellPrice: number; exp: number;
  levelReq: number; rarity: "common" | "rare" | "epic";
  color: string; leafColor: string;
}

interface Plot {
  id: number; crop: CropType | null;
  plantedAt: number | null; watered: boolean;
}

interface Quest {
  id: string; name: string; target: number; progress: number;
  rewardGold: number; rewardExp: number;
  type: "harvest" | "plant" | "water" | "sell"; claimed: boolean;
}

interface Particle {
  id: string; x: number; y: number; emoji: string;
  vx: number; vy: number; scale: number;
}

// ==================== CONFIG ====================
const CROPS: Record<CropType, CropConfig> = {
  carrot:     { name: "Cà rốt",  emoji: "🥕", growTime: 15, seedCost: 5,   sellPrice: 18,   exp: 10,  levelReq: 1, rarity: "common", color: "from-orange-400 to-orange-600", leafColor: "text-green-600" },
  tomato:     { name: "Cà chua", emoji: "🍅", growTime: 30, seedCost: 15,  sellPrice: 55,   exp: 25,  levelReq: 1, rarity: "common", color: "from-red-400 to-red-600", leafColor: "text-green-700" },
  corn:       { name: "Ngô",     emoji: "🌽", growTime: 45, seedCost: 25,  sellPrice: 95,   exp: 40,  levelReq: 2, rarity: "rare",   color: "from-yellow-400 to-yellow-600", leafColor: "text-green-600" },
  pumpkin:    { name: "Bí ngô",  emoji: "🎃", growTime: 60, seedCost: 40,  sellPrice: 160,  exp: 60,  levelReq: 3, rarity: "rare",   color: "from-amber-400 to-orange-600", leafColor: "text-green-700" },
  watermelon: { name: "Dưa hấu", emoji: "🍉", growTime: 90, seedCost: 70,  sellPrice: 320,  exp: 120, levelReq: 5, rarity: "epic",   color: "from-green-400 to-emerald-600", leafColor: "text-emerald-800" },
};

const NUM_PLOTS = 9;
const STORAGE_KEY = "aio-farm-v3";

const RARITY_CFG = {
  common: { ring: "ring-gray-300",    bg: "bg-gray-50",    label: "bg-gray-200 text-gray-700" },
  rare:   { ring: "ring-purple-400",  bg: "bg-purple-50",  label: "bg-purple-500 text-white" },
  epic:   { ring: "ring-pink-400",    bg: "bg-pink-50",    label: "bg-gradient-to-r from-pink-500 to-purple-500 text-white" },
};

// ==================== SOUND ENGINE (Web Audio, no files) ====================
class SoundFX {
  private ctx: AudioContext | null = null;
  private enabled = true;

  private ensure() {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      try { this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)(); }
      catch { return null; }
    }
    return this.ctx;
  }

  private tone(freq: number, dur: number, type: OscillatorType = "sine", vol = 0.1, delay = 0) {
    if (!this.enabled) return;
    const ctx = this.ensure();
    if (!ctx) return;
    const t = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(vol, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + dur);
  }

  plant()  { this.tone(400, 0.15, "sine", 0.08); this.tone(600, 0.1, "sine", 0.05, 0.05); }
  water()  { this.tone(800, 0.1, "triangle", 0.06); this.tone(500, 0.15, "triangle", 0.05, 0.05); }
  harvest(){ [523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.2, "sine", 0.08, i * 0.07)); }
  buy()    { this.tone(800, 0.08, "square", 0.04); this.tone(1000, 0.1, "square", 0.04, 0.05); }
  sell()   { [659, 784].forEach((f, i) => this.tone(f, 0.15, "triangle", 0.07, i * 0.08)); }
  levelup(){ [523, 659, 784, 1047, 1319].forEach((f, i) => this.tone(f, 0.3, "sine", 0.1, i * 0.1)); }
  error()  { this.tone(300, 0.15, "sawtooth", 0.06); }
  click()  { this.tone(700, 0.05, "sine", 0.04); }
}

const sfx = new SoundFX();

// ==================== HELPERS ====================
function expForLvl(l: number) { return 100 + (l - 1) * 50; }

function newQuests(): Quest[] {
  return [
    { id: "q1", name: "Thu hoạch 5 cây",    target: 5, progress: 0, rewardGold: 60,  rewardExp: 30, type: "harvest", claimed: false },
    { id: "q2", name: "Trồng 3 cây",         target: 3, progress: 0, rewardGold: 40,  rewardExp: 20, type: "plant",   claimed: false },
    { id: "q3", name: "Tưới nước 5 lần",     target: 5, progress: 0, rewardGold: 50,  rewardExp: 25, type: "water",   claimed: false },
    { id: "q4", name: "Bán 3 nông sản",      target: 3, progress: 0, rewardGold: 80,  rewardExp: 40, type: "sell",    claimed: false },
  ];
}

function getGrowthStage(pct: number): { emoji: string; scale: number; label: string } {
  if (pct < 20)  return { emoji: "🌰", scale: 0.5, label: "Hạt" };
  if (pct < 45)  return { emoji: "🌱", scale: 0.7, label: "Mầm" };
  if (pct < 75)  return { emoji: "🌿", scale: 0.9, label: "Cây non" };
  if (pct < 100) return { emoji: "🌾", scale: 1.0, label: "Sắp chín" };
  return { emoji: "✨", scale: 1.1, label: "Chín" };
}

// ==================== MAIN COMPONENT ====================
export default function FarmPage() {
  const [gold, setGold] = useState(150);
  const [level, setLevel] = useState(1);
  const [exp, setExp] = useState(0);
  const [plots, setPlots] = useState<Plot[]>(
    Array.from({ length: NUM_PLOTS }, (_, i) => ({ id: i, crop: null, plantedAt: null, watered: false }))
  );
  const [selectedTool, setSelectedTool] = useState<ToolType>("carrot");
  const [now, setNow] = useState(Date.now());
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" | "info" } | null>(null);
  const [modal, setModal] = useState<ModalType>(null);
  const [inv, setInv] = useState<Record<CropType, number>>({ carrot: 0, tomato: 0, corn: 0, pumpkin: 0, watermelon: 0 });
  const [quests, setQuests] = useState<Quest[]>(newQuests());
  const [particles, setParticles] = useState<Particle[]>([]);
  const [shake, setShake] = useState(false);
  const [flash, setFlash] = useState(false);
  const [drag, setDrag] = useState<{ active: boolean; tool: ToolType | null; x: number; y: number; hover: number | null }>({
    active: false, tool: null, x: 0, y: 0, hover: null
  });
  const [showWelcome, setShowWelcome] = useState(false);
  const plotRefs = useRef<Record<number, HTMLDivElement | null>>({});

  // ============ LOAD SAVE ============
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const d = JSON.parse(saved);
        setGold(d.gold ?? 150);
        setLevel(d.level ?? 1);
        setExp(d.exp ?? 0);
        setPlots(d.plots ?? Array.from({ length: NUM_PLOTS }, (_, i) => ({ id: i, crop: null, plantedAt: null, watered: false })));
        setInv(d.inv ?? { carrot: 0, tomato: 0, corn: 0, pumpkin: 0, watermelon: 0 });
        setQuests(d.quests ?? newQuests());
      } else {
        setShowWelcome(true);
        setTimeout(() => setShowWelcome(false), 2500);
      }
    } catch {}
  }, []);

  // ============ SAVE ============
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ gold, level, exp, plots, inv, quests }));
    } catch {}
  }, [gold, level, exp, plots, inv, quests]);

  // ============ TICK ============
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, []);

  // ============ HELPERS ============
  const showToast = (msg: string, type: "success" | "error" | "info" = "info") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2000);
  };

  const addExp = (amount: number) => {
    setExp((prev) => {
      let newExp = prev + amount;
      let newLevel = level;
      let leveled = false;
      while (newExp >= expForLvl(newLevel)) {
        newExp -= expForLvl(newLevel);
        newLevel += 1;
        leveled = true;
      }
      if (leveled) {
        setTimeout(() => {
          setLevel(newLevel);
          sfx.levelup();
          setModal("levelup");
          setTimeout(() => setModal(null), 2200);
        }, 400);
      }
      return newExp;
    });
  };

  const updateQuest = (type: Quest["type"], amount: number = 1) => {
    setQuests((prev) => prev.map((q) =>
      q.type === type && !q.claimed ? { ...q, progress: Math.min(q.target, q.progress + amount) } : q
    ));
  };

  const getProgress = useCallback((plot: Plot): number => {
    if (!plot.crop || !plot.plantedAt) return 0;
    const cfg = CROPS[plot.crop];
    const elapsed = (now - plot.plantedAt) / 1000;
    const speed = plot.watered ? 1.5 : 1;
    return Math.min(100, (elapsed * speed / cfg.growTime) * 100);
  }, [now]);

  const isReady = (plot: Plot) => getProgress(plot) >= 100;

  // ============ PARTICLES ============
  const spawnParticles = (x: number, y: number, emojis: string[], count = 6) => {
    const newParts: Particle[] = [];
    for (let i = 0; i < count; i++) {
      newParts.push({
        id: `${Date.now()}-${i}-${Math.random()}`,
        x, y,
        emoji: emojis[Math.floor(Math.random() * emojis.length)],
        vx: (Math.random() - 0.5) * 200,
        vy: -100 - Math.random() * 150,
        scale: 0.8 + Math.random() * 0.6,
      });
    }
    setParticles((p) => [...p, ...newParts]);
    setTimeout(() => {
      setParticles((p) => p.filter((pt) => !newParts.find((np) => np.id === pt.id)));
    }, 1400);
  };

  // ============ SCREEN EFFECTS ============
  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 400);
  };
  const triggerFlash = () => {
    setFlash(true);
    setTimeout(() => setFlash(false), 300);
  };

  // ============ ACTIONS ============
  const plantSeed = (plotId: number, crop: CropType, x?: number, y?: number) => {
    const plot = plots[plotId];
    if (plot.crop) { sfx.error(); return showToast("Ô này đã có cây!", "error"); }
    const cfg = CROPS[crop];
    if (level < cfg.levelReq) { sfx.error(); return showToast(`Cần cấp ${cfg.levelReq}`, "error"); }
    if (gold < cfg.seedCost) { sfx.error(); return showToast(`Không đủ vàng! Cần ${cfg.seedCost}`, "error"); }
    setGold((g) => g - cfg.seedCost);
    setPlots((p) => p.map((pl) => pl.id === plotId ? { ...pl, crop, plantedAt: Date.now(), watered: false } : pl));
    updateQuest("plant");
    sfx.plant();
    if (x !== undefined && y !== undefined) spawnParticles(x, y, ["🌱", "💫", "✨"], 5);
    showToast(`Đã trồng ${cfg.name}!`, "success");
  };

  const waterPlot = (plotId: number, x?: number, y?: number) => {
    const plot = plots[plotId];
    if (!plot.crop) { sfx.error(); return showToast("Chưa có cây!", "error"); }
    if (plot.watered) { sfx.error(); return showToast("Đã tưới rồi!", "error"); }
    if (isReady(plot)) { sfx.error(); return showToast("Cây đã chín, hãy thu hoạch!", "error"); }
    setPlots((p) => p.map((pl) => pl.id === plotId ? { ...pl, watered: true } : pl));
    updateQuest("water");
    sfx.water();
    if (x !== undefined && y !== undefined) spawnParticles(x, y, ["💧", "💦", "✨"], 8);
    showToast("Đã tưới! +50% tốc độ", "success");
  };

  const harvestPlot = (plotId: number, x?: number, y?: number) => {
    const plot = plots[plotId];
    if (!plot.crop || !isReady(plot)) { sfx.error(); return showToast("Cây chưa chín!", "error"); }
    const cfg = CROPS[plot.crop];
    setInv((inv) => ({ ...inv, [plot.crop!]: inv[plot.crop!] + 1 }));
    setPlots((p) => p.map((pl) => pl.id === plotId ? { ...pl, crop: null, plantedAt: null, watered: false } : pl));
    updateQuest("harvest");
    sfx.harvest();
    triggerShake();
    if (x !== undefined && y !== undefined) spawnParticles(x, y, ["🌟", cfg.emoji, "💰", "✨"], 10);
    showToast(`Thu hoạch ${cfg.name}! 📦`, "success");
  };

  const sellCrop = (crop: CropType) => {
    if (inv[crop] <= 0) return;
    const cfg = CROPS[crop];
    setInv((i) => ({ ...i, [crop]: i[crop] - 1 }));
    setGold((g) => g + cfg.sellPrice);
    addExp(cfg.exp);
    updateQuest("sell");
    sfx.sell();
    triggerFlash();
    showToast(`+${cfg.sellPrice} vàng! 💰`, "success");
  };

  const sellAll = () => {
    const total = (Object.keys(inv) as CropType[]).reduce((sum, k) => sum + inv[k] * CROPS[k].sellPrice, 0);
    if (total === 0) return;
    const totalExp = (Object.keys(inv) as CropType[]).reduce((sum, k) => sum + inv[k] * CROPS[k].exp, 0);
    setGold((g) => g + total);
    addExp(totalExp);
    setInv({ carrot: 0, tomato: 0, corn: 0, pumpkin: 0, watermelon: 0 });
    updateQuest("sell", 3);
    sfx.sell();
    triggerFlash();
    showToast(`+${total} vàng! 💰💰`, "success");
  };

  const claimQuest = (id: string) => {
    const q = quests.find((x) => x.id === id);
    if (!q || q.claimed || q.progress < q.target) return;
    setGold((g) => g + q.rewardGold);
    addExp(q.rewardExp);
    setQuests((prev) => prev.map((x) => x.id === id ? { ...x, claimed: true } : x));
    sfx.buy();
    triggerFlash();
    showToast(`+${q.rewardGold}💰 +${q.rewardExp}⭐`, "success");
  };

  const resetGame = () => {
    if (!confirm("Chơi lại từ đầu? Tiến trình sẽ bị xoá.")) return;
    setGold(150); setLevel(1); setExp(0);
    setPlots(Array.from({ length: NUM_PLOTS }, (_, i) => ({ id: i, crop: null, plantedAt: null, watered: false })));
    setInv({ carrot: 0, tomato: 0, corn: 0, pumpkin: 0, watermelon: 0 });
    setQuests(newQuests());
    localStorage.removeItem(STORAGE_KEY);
    showToast("Đã chơi lại!", "info");
  };

  // ============ DRAG ============
  const findPlot = (x: number, y: number): number | null => {
    for (const [id, el] of Object.entries(plotRefs.current)) {
      if (!el) continue;
      const r = el.getBoundingClientRect();
      if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) return Number(id);
    }
    return null;
  };

  const onPointerDown = (e: React.PointerEvent, tool: ToolType) => {
    e.preventDefault();
    sfx.click();
    setDrag({ active: true, tool, x: e.clientX, y: e.clientY, hover: null });
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  useEffect(() => {
    if (!drag.active) return;
    const move = (e: PointerEvent) => {
      const h = findPlot(e.clientX, e.clientY);
      setDrag((d) => ({ ...d, x: e.clientX, y: e.clientY, hover: h }));
    };
    const up = (e: PointerEvent) => {
      const id = findPlot(e.clientX, e.clientY);
      if (id !== null && drag.tool) {
        const el = plotRefs.current[id];
        const r = el?.getBoundingClientRect();
        const cx = r ? r.left + r.width / 2 : e.clientX;
        const cy = r ? r.top + r.height / 2 : e.clientY;
        if (drag.tool === "water") waterPlot(id, cx, cy);
        else if (drag.tool === "sickle") harvestPlot(id, cx, cy);
        else plantSeed(id, drag.tool, cx, cy);
      }
      setDrag({ active: false, tool: null, x: 0, y: 0, hover: null });
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); };
  }, [drag.active, drag.tool, plots, gold, level]);

  const expNeed = expForLvl(level);
  const expPct = (exp / expNeed) * 100;
  const toolEmoji = (t: ToolType) => t === "water" ? "💧" : t === "sickle" ? "✂️" : CROPS[t].emoji;
  const availableQuests = quests.filter((q) => q.progress >= q.target && !q.claimed).length;
  const totalInvCount = Object.values(inv).reduce((a, b) => a + b, 0);

  // ============ RENDER ============
  return (
    <main className="min-h-screen relative overflow-hidden select-none touch-none" style={{ background: "linear-gradient(to bottom, #87CEEB 0%, #B0E0E6 30%, #A8D5BA 60%, #7CB342 100%)" }}>

      {/* ====== SKY DECORATION ====== */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Sun */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
          className="absolute top-8 right-8 w-16 h-16 rounded-full bg-yellow-300 shadow-[0_0_60px_20px_rgba(253,224,71,0.5)]"
        />
        {/* Clouds */}
        <motion.div
          animate={{ x: [0, 30, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-12 left-10 text-5xl opacity-80"
        >☁️</motion.div>
        <motion.div
          animate={{ x: [0, -40, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-24 right-32 text-4xl opacity-70"
        >☁️</motion.div>
        <motion.div
          animate={{ x: [0, 20, 0] }}
          transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-4 left-1/2 text-3xl opacity-60"
        >☁️</motion.div>
      </div>

      {/* ====== SCREEN SHAKE ====== */}
      <motion.div
        animate={shake ? { x: [0, -6, 6, -4, 4, 0] } : {}}
        transition={{ duration: 0.4 }}
        className="relative z-10"
      >

        {/* ====== TOP HUD ====== */}
        <div className="p-3 md:p-4">
          <div className="max-w-3xl mx-auto flex items-center justify-between gap-2">

            {/* Level + XP */}
            <div className="flex items-center gap-2.5 bg-white/95 backdrop-blur-sm rounded-2xl p-1.5 pr-3 shadow-lg border-2 border-yellow-300">
              <div className="relative">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-white font-black text-lg shadow-inner border-2 border-yellow-200">
                  {level}
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
              </div>
              <div className="min-w-[100px]">
                <div className="text-[10px] font-bold text-amber-800 uppercase tracking-wide">Trang trại</div>
                <div className="h-2 bg-amber-200 rounded-full overflow-hidden mt-0.5 shadow-inner">
                  <motion.div
                    className="h-full bg-gradient-to-r from-green-400 to-lime-500"
                    animate={{ width: `${expPct}%` }}
                    transition={{ duration: 0.5, type: "spring" }}
                  />
                </div>
                <div className="text-[9px] text-amber-700 font-semibold mt-0.5">{exp}/{expNeed} XP</div>
              </div>
            </div>

            {/* Gold */}
            <motion.div
              key={gold}
              initial={{ scale: 1 }}
              animate={{ scale: [1, 1.08, 1] }}
              transition={{ duration: 0.3 }}
              className="flex items-center gap-1.5 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-2xl px-4 py-2.5 shadow-lg border-2 border-yellow-200"
            >
              <Coins className="w-5 h-5 text-white drop-shadow" strokeWidth={2.5} />
              <span className="text-white font-black text-lg drop-shadow">{gold.toLocaleString()}</span>
            </motion.div>
          </div>
        </div>

        {/* ====== MAIN GRID + SIDEBAR ====== */}
        <div className="max-w-3xl mx-auto px-3 pb-32">
          <div className="flex gap-3">

            {/* FARM GRID */}
            <div className="flex-1 relative">
              <div className="grid grid-cols-3 gap-2.5 md:gap-3 pt-4">
                {plots.map((plot, idx) => {
                  const pct = getProgress(plot);
                  const ready = isReady(plot);
                  const cfg = plot.crop ? CROPS[plot.crop] : null;
                  const stage = getGrowthStage(pct);
                  const isHovered = drag.active && drag.hover === plot.id;
                  const canDrop =
                    isHovered && drag.tool &&
                    ((drag.tool === "water" && plot.crop && !plot.watered && !ready) ||
                     (drag.tool === "sickle" && plot.crop && ready) ||
                     (drag.tool !== "water" && drag.tool !== "sickle" && !plot.crop));

                  return (
                    <motion.div
                      key={plot.id}
                      ref={(el) => { plotRefs.current[plot.id] = el; }}
                      initial={{ scale: 0, rotate: -20 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ delay: idx * 0.04, type: "spring", bounce: 0.5 }}
                      whileHover={{ y: -4 }}
                      className={`relative aspect-square rounded-2xl transition-all ${
                        isHovered ? (canDrop ? "ring-4 ring-green-400 scale-105" : "ring-4 ring-red-400") : ""
                      }`}
                      style={{
                        background: "linear-gradient(145deg, #8B5A2B 0%, #6D4420 100%)",
                        boxShadow: isHovered && canDrop
                          ? "0 0 30px rgba(74,222,128,0.9), inset 0 2px 4px rgba(255,255,255,0.2)"
                          : "0 6px 0 #4A2E14, inset 0 2px 4px rgba(255,255,255,0.15), inset 0 -2px 4px rgba(0,0,0,0.3)",
                      }}
                    >
                      {/* Grass edges */}
                      <div className="absolute inset-0 rounded-2xl" style={{
                        background: "radial-gradient(circle at center, transparent 60%, rgba(101,163,13,0.3) 100%)"
                      }} />

                      {/* Inner soil texture */}
                      <div className="absolute inset-1.5 rounded-xl" style={{
                        background: "radial-gradient(circle at 30% 30%, #9B6935 0%, #7A4A1F 60%, #5D3712 100%)",
                        boxShadow: "inset 0 3px 6px rgba(0,0,0,0.3), inset 0 -2px 3px rgba(255,255,255,0.08)",
                      }}>
                        {/* Soil dots */}
                        <div className="absolute inset-0 rounded-xl opacity-40" style={{
                          backgroundImage: "radial-gradient(circle, #4A2E14 1px, transparent 1px)",
                          backgroundSize: "8px 8px",
                        }} />

                        {/* Content */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          {!plot.crop ? (
                            <motion.div
                              animate={{ opacity: [0.4, 0.7, 0.4] }}
                              transition={{ duration: 2, repeat: Infinity }}
                              className="text-3xl"
                            >🌱</motion.div>
                          ) : ready ? (
                            <motion.div
                              animate={{ scale: [1, 1.15, 1], rotate: [-5, 5, -5] }}
                              transition={{ duration: 1.2, repeat: Infinity }}
                              className="text-4xl md:text-5xl drop-shadow-lg"
                              style={{ filter: "drop-shadow(0 0 10px rgba(255,215,0,0.8))" }}
                            >
                              {cfg!.emoji}
                            </motion.div>
                          ) : (
                            <motion.div
                              animate={{ scale: [1, 1.05, 1] }}
                              transition={{ duration: 2, repeat: Infinity }}
                              className="text-3xl md:text-4xl drop-shadow"
                              style={{ transform: `scale(${stage.scale})` }}
                            >
                              {stage.emoji}
                            </motion.div>
                          )}
                        </div>

                        {/* Progress bar */}
                        {plot.crop && !ready && (
                          <div className="absolute bottom-1.5 left-1.5 right-1.5">
                            <div className="h-1.5 bg-black/50 rounded-full overflow-hidden">
                              <motion.div
                                className="h-full bg-gradient-to-r from-green-400 via-lime-400 to-yellow-400"
                                animate={{ width: `${pct}%` }}
                                transition={{ duration: 0.3 }}
                              />
                            </div>
                          </div>
                        )}

                        {/* Water indicator */}
                        {plot.watered && plot.crop && !ready && (
                          <motion.div
                            animate={{ y: [0, -3, 0] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                            className="absolute top-1 right-1 text-sm"
                          >💧</motion.div>
                        )}
                      </div>

                      {/* Ready pulse */}
                      {ready && (
                        <>
                          <motion.div
                            animate={{ scale: [1, 1.4, 1], opacity: [0.6, 0, 0.6] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                            className="absolute inset-0 rounded-2xl border-4 border-yellow-300"
                          />
                          <motion.div
                            animate={{ scale: [1, 1.3, 1], y: [0, -4, 0] }}
                            transition={{ duration: 1, repeat: Infinity }}
                            className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-gradient-to-br from-yellow-300 to-yellow-500 border-2 border-white flex items-center justify-center text-xs font-black text-yellow-900 shadow-lg"
                          >!</motion.div>
                        </>
                      )}
                    </motion.div>
                  );
                })}
              </div>

              {/* Ground decorations */}
              <div className="absolute -bottom-2 -left-2 text-3xl opacity-90 pointer-events-none">🌳</div>
              <div className="absolute -bottom-1 right-2 text-2xl opacity-90 pointer-events-none">🌸</div>
            </div>

            {/* SIDEBAR */}
            <div className="flex flex-col gap-2 pt-4">
              <SideBtn icon={<ShoppingCart className="w-5 h-5" />} badge={null} onClick={() => { sfx.click(); setModal("shop"); }} label="Shop" color="amber" />
              <SideBtn icon={<Backpack className="w-5 h-5" />} badge={totalInvCount || null} onClick={() => { sfx.click(); setModal("inventory"); }} label="Kho" color="blue" />
              <SideBtn icon={<ScrollText className="w-5 h-5" />} badge={availableQuests || null} onClick={() => { sfx.click(); setModal("quest"); }} label="Nhiệm" color="purple" />
              <SideBtn icon={<Gift className="w-5 h-5" />} badge="!" onClick={() => { sfx.click(); setModal("reward"); }} label="Thưởng" color="pink" />
              <button
                onClick={() => { if (confirm("Chơi lại từ đầu?")) { sfx.click(); resetGame(); } }}
                className="w-14 h-14 rounded-2xl bg-gradient-to-br from-gray-500 to-gray-700 border-2 border-gray-300 flex items-center justify-center text-white shadow-lg hover:scale-105 active:scale-95 transition"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

      </motion.div>

      {/* ====== HINT ====== */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="fixed bottom-32 left-1/2 -translate-x-1/2 z-10 px-4 py-2 rounded-full bg-yellow-200/90 backdrop-blur border-2 border-yellow-400 text-xs font-bold text-amber-900 shadow-lg whitespace-nowrap"
      >
        👆 Kéo công cụ xuống ô đất
      </motion.div>

      {/* ====== TOOLBAR ====== */}
      <div className="fixed bottom-0 left-0 right-0 z-20 p-2 pb-3" style={{
        background: "linear-gradient(to top, rgba(101,67,33,0.98) 0%, rgba(101,67,33,0.9) 80%, transparent 100%)"
      }}>
        <div className="max-w-3xl mx-auto">
          <div className="flex gap-1.5 justify-center">
            {(Object.keys(CROPS) as CropType[]).map((key) => {
              const c = CROPS[key];
              const locked = level < c.levelReq;
              const selected = selectedTool === key;
              return (
                <button
                  key={key}
                  onPointerDown={(e) => !locked && onPointerDown(e, key)}
                  onClick={() => !locked && setSelectedTool(key)}
                  className={`relative flex-shrink-0 w-14 h-14 md:w-16 md:h-16 rounded-2xl border-2 transition-all flex flex-col items-center justify-center touch-none ${
                    locked
                      ? "bg-gray-700/80 border-gray-500 opacity-60"
                      : selected
                      ? "bg-gradient-to-br from-yellow-300 to-yellow-500 border-yellow-100 scale-110 shadow-xl ring-2 ring-yellow-200"
                      : "bg-gradient-to-br from-amber-600 to-amber-800 border-amber-400 hover:scale-105 active:scale-95"
                  }`}
                >
                  <div className="text-2xl leading-none">{locked ? <Lock className="w-5 h-5 text-gray-300" /> : c.emoji}</div>
                  {!locked && (
                    <div className="text-[8px] font-bold text-white mt-0.5 drop-shadow flex items-center gap-0.5">
                      {c.seedCost}<span className="text-[7px]">💰</span>
                    </div>
                  )}
                  {locked && <div className="absolute -bottom-1 text-[8px] font-bold text-white bg-black/60 px-1 rounded">Lv{c.levelReq}</div>}
                </button>
              );
            })}
            <button
              onPointerDown={(e) => onPointerDown(e, "water")}
              onClick={() => setSelectedTool("water")}
              className={`flex-shrink-0 w-14 h-14 md:w-16 md:h-16 rounded-2xl border-2 flex flex-col items-center justify-center touch-none transition-all ${
                selectedTool === "water"
                  ? "bg-gradient-to-br from-blue-400 to-blue-600 border-blue-200 scale-110 shadow-xl"
                  : "bg-gradient-to-br from-blue-500 to-blue-700 border-blue-300 hover:scale-105 active:scale-95"
              }`}
            >
              <Droplets className="w-6 h-6 text-white" />
              <div className="text-[8px] font-bold text-white mt-0.5">Tưới</div>
            </button>
            <button
              onPointerDown={(e) => onPointerDown(e, "sickle")}
              onClick={() => setSelectedTool("sickle")}
              className={`flex-shrink-0 w-14 h-14 md:w-16 md:h-16 rounded-2xl border-2 flex flex-col items-center justify-center touch-none transition-all ${
                selectedTool === "sickle"
                  ? "bg-gradient-to-br from-rose-400 to-rose-600 border-rose-200 scale-110 shadow-xl"
                  : "bg-gradient-to-br from-rose-500 to-rose-700 border-rose-300 hover:scale-105 active:scale-95"
              }`}
            >
              <Scissors className="w-6 h-6 text-white" />
              <div className="text-[8px] font-bold text-white mt-0.5">Thu</div>
            </button>
          </div>
        </div>
      </div>

      {/* ====== DRAG GHOST ====== */}
      <AnimatePresence>
        {drag.active && drag.tool && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1.5, opacity: 1, rotate: [0, 5, -5, 0] }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ rotate: { duration: 1, repeat: Infinity } }}
            className="fixed pointer-events-none z-50 text-5xl"
            style={{
              left: drag.x, top: drag.y,
              transform: "translate(-50%, -50%)",
              filter: "drop-shadow(0 0 15px rgba(255,255,255,1)) drop-shadow(0 0 30px rgba(253,224,71,0.8))",
            }}
          >
            {toolEmoji(drag.tool)}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ====== PARTICLES ====== */}
      <AnimatePresence>
        {particles.map((p) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 1, scale: 0, x: p.x, y: p.y }}
            animate={{
              opacity: 0,
              scale: p.scale,
              x: p.x + p.vx,
              y: p.y + p.vy,
              rotate: [0, 360],
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="fixed pointer-events-none z-40 text-2xl"
            style={{ left: 0, top: 0 }}
          >
            {p.emoji}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* ====== FLASH ====== */}
      <AnimatePresence>
        {flash && (
          <motion.div
            initial={{ opacity: 0.6 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-yellow-200 pointer-events-none z-30"
          />
        )}
      </AnimatePresence>

      {/* ====== WELCOME OVERLAY ====== */}
      <AnimatePresence>
        {showWelcome && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.5 }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 flex items-center justify-center pointer-events-none z-50"
          >
            <div className="text-center">
              <motion.div
                animate={{ rotate: [0, -10, 10, 0], scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="text-8xl mb-4"
              >🌾</motion.div>
              <div className="text-3xl font-black text-white drop-shadow-lg" style={{
                textShadow: "2px 2px 0 #F59E0B, 4px 4px 0 rgba(0,0,0,0.3)"
              }}>NÔNG TRẠI VUI VẺ</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ====== TOAST ====== */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -40, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.8 }}
            className={`fixed top-24 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl shadow-2xl text-sm font-bold flex items-center gap-2 ${
              toast.type === "success" ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white" :
              toast.type === "error" ? "bg-gradient-to-r from-red-500 to-rose-600 text-white" :
              "bg-gradient-to-r from-gray-800 to-gray-900 text-white"
            }`}
          >
            {toast.type === "success" ? "✅" : toast.type === "error" ? "❌" : "ℹ️"} {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ====== MODAL: LEVEL UP ====== */}
      <AnimatePresence>
        {modal === "levelup" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center pointer-events-none"
          >
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 1.5, opacity: 0 }}
              transition={{ type: "spring", bounce: 0.5 }}
              className="text-center"
            >
              <motion.div
                animate={{ y: [0, -20, 0] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="text-9xl mb-2"
              >⭐</motion.div>
              <div className="bg-gradient-to-r from-yellow-400 to-amber-500 px-8 py-3 rounded-2xl shadow-2xl border-4 border-white">
                <div className="text-xs font-bold text-amber-900 uppercase tracking-widest">Lên cấp</div>
                <div className="text-5xl font-black text-white drop-shadow">{level}</div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ====== MODALS ====== */}
      <AnimatePresence>
        {modal && modal !== "levelup" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 flex items-end sm:items-center justify-center p-0 sm:p-4"
            onClick={() => setModal(null)}
          >
            <motion.div
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-gradient-to-b from-amber-50 to-yellow-100 rounded-t-3xl sm:rounded-3xl shadow-2xl border-t-4 sm:border-4 border-yellow-600 w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal handle (mobile) */}
              <div className="sm:hidden flex justify-center pt-2">
                <div className="w-12 h-1.5 rounded-full bg-amber-700/30" />
              </div>

              {/* Header */}
              <div className="px-5 py-4 flex items-center justify-between border-b-2 border-amber-300">
                <h2 className="text-xl font-black text-amber-900 flex items-center gap-2">
                  {modal === "shop" && <><ShoppingCart className="w-5 h-5" /> Cửa hàng</>}
                  {modal === "inventory" && <><Backpack className="w-5 h-5" /> Kho hàng</>}
                  {modal === "quest" && <><ScrollText className="w-5 h-5" /> Nhiệm vụ</>}
                  {modal === "reward" && <><Gift className="w-5 h-5" /> Thưởng</>}
                </h2>
                <button onClick={() => { sfx.click(); setModal(null); }} className="w-9 h-9 rounded-full bg-amber-200 hover:bg-amber-300 flex items-center justify-center text-amber-900">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-4 overflow-y-auto flex-1">

                {/* SHOP */}
                {modal === "shop" && (
                  <div className="grid grid-cols-2 gap-3">
                    {(Object.keys(CROPS) as CropType[]).map((key) => {
                      const c = CROPS[key];
                      const locked = level < c.levelReq;
                      const rar = RARITY_CFG[c.rarity];
                      const canAfford = gold >= c.seedCost;
                      return (
                        <div key={key} className={`relative rounded-2xl p-3 border-2 ${locked ? "border-gray-300 opacity-60" : "border-amber-300"} bg-white shadow-md`}>
                          {locked && (
                            <div className="absolute inset-0 bg-black/70 rounded-2xl flex items-center justify-center text-white text-xs font-bold z-10">
                              <Lock className="w-4 h-4 mr-1" /> Cấp {c.levelReq}
                            </div>
                          )}
                          <div className={`absolute top-2 right-2 text-[9px] font-black px-1.5 py-0.5 rounded ${rar.label}`}>
                            {c.rarity === "common" ? "Thường" : c.rarity === "rare" ? "Hiếm" : "Sử thi"}
                          </div>
                          <div className="text-4xl text-center my-2">{c.emoji}</div>
                          <div className="text-center font-black text-amber-900 text-sm">{c.name}</div>
                          <div className="flex justify-between text-[10px] mt-2 px-1">
                            <span className="text-gray-500">⏱ {c.growTime}s</span>
                            <span className="text-purple-600 font-bold">⭐ {c.exp}</span>
                          </div>
                          <div className="flex justify-between items-center mt-2 pt-2 border-t border-amber-200">
                            <span className="text-red-600 font-black text-sm">{c.seedCost}💰</span>
                            <span className="text-green-600 font-bold text-xs">→ {c.sellPrice}💰</span>
                          </div>
                          <button
                            disabled={locked || !canAfford}
                            onClick={() => {
                              if (!canAfford) { sfx.error(); return showToast("Không đủ vàng!", "error"); }
                              setGold((g) => g - c.seedCost);
                              setInv((i) => ({ ...i, [key]: i[key] + 1 }));
                              sfx.buy();
                              showToast(`Đã mua ${c.name}!`, "success");
                            }}
                            className={`w-full mt-2 py-2 rounded-xl text-xs font-black transition-all ${
                              locked || !canAfford
                                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                : "bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:scale-105 active:scale-95"
                            }`}
                          >
                            {!canAfford ? "Không đủ 💰" : "Mua"}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* INVENTORY */}
                {modal === "inventory" && (
                  <div>
                    {totalInvCount === 0 ? (
                      <div className="text-center py-12">
                        <Backpack className="w-16 h-16 mx-auto mb-3 text-amber-300" />
                        <p className="text-amber-700 font-bold">Kho trống</p>
                        <p className="text-xs text-amber-600 mt-1">Thu hoạch cây để có nông sản!</p>
                      </div>
                    ) : (
                      <>
                        <div className="grid grid-cols-2 gap-3 mb-4">
                          {(Object.keys(inv) as CropType[]).map((key) => {
                            if (inv[key] === 0) return null;
                            const c = CROPS[key];
                            const rar = RARITY_CFG[c.rarity];
                            return (
                              <div key={key} className={`rounded-2xl p-3 border-2 border-amber-300 bg-white shadow-md relative`}>
                                <div className={`absolute top-2 right-2 text-[9px] font-black px-1.5 py-0.5 rounded ${rar.label}`}>
                                  x{inv[key]}
                                </div>
                                <div className="text-4xl text-center my-2">{c.emoji}</div>
                                <div className="text-center font-black text-amber-900 text-sm">{c.name}</div>
                                <button
                                  onClick={() => sellCrop(key)}
                                  className="w-full mt-2 py-2 rounded-xl bg-gradient-to-r from-yellow-400 to-amber-500 text-amber-900 text-xs font-black hover:scale-105 active:scale-95"
                                >
                                  Bán +{c.sellPrice}💰
                                </button>
                              </div>
                            );
                          })}
                        </div>
                        <button
                          onClick={sellAll}
                          className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 text-white font-black text-sm shadow-lg hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
                        >
                          <Zap className="w-4 h-4" /> Bán tất cả
                        </button>
                      </>
                    )}
                  </div>
                )}

                {/* QUEST */}
                {modal === "quest" && (
                  <div className="space-y-3">
                    {quests.map((q) => {
                      const done = q.progress >= q.target;
                      const pct = (q.progress / q.target) * 100;
                      return (
                        <div key={q.id} className={`rounded-2xl p-3 border-2 bg-white shadow-md ${q.claimed ? "border-gray-300 opacity-60" : done ? "border-green-400" : "border-amber-300"}`}>
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex-1">
                              <div className="font-black text-sm text-amber-900">{q.name}</div>
                              <div className="text-xs text-gray-500">{q.progress}/{q.target}</div>
                            </div>
                            <div className="text-right text-xs">
                              <div className="text-yellow-600 font-black">+{q.rewardGold}💰</div>
                              <div className="text-purple-600 font-bold">+{q.rewardExp}⭐</div>
                            </div>
                          </div>
                          <div className="h-2 bg-gray-200 rounded-full overflow-hidden mb-2">
                            <motion.div
                              className="h-full bg-gradient-to-r from-green-400 to-emerald-500"
                              animate={{ width: `${pct}%` }}
                            />
                          </div>
                          <button
                            disabled={!done || q.claimed}
                            onClick={() => claimQuest(q.id)}
                            className={`w-full py-2 rounded-xl text-xs font-black transition-all ${
                              q.claimed
                                ? "bg-gray-200 text-gray-500"
                                : done
                                ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:scale-[1.02]"
                                : "bg-gray-200 text-gray-400"
                            }`}
                          >
                            {q.claimed ? "✓ Đã nhận" : done ? "Nhận thưởng" : "Chưa hoàn thành"}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* REWARD */}
                {modal === "reward" && (
                  <div className="text-center py-4">
                    <motion.div
                      animate={{ rotate: [0, -10, 10, 0], scale: [1, 1.1, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="text-7xl mb-3"
                    >🎁</motion.div>
                    <h3 className="font-black text-lg text-amber-900 mb-1">Quà tặng hàng ngày</h3>
                    <p className="text-sm text-amber-700 mb-5">Nhận 50 vàng miễn phí mỗi ngày!</p>
                    <button
                      onClick={() => {
                        setGold((g) => g + 50);
                        sfx.sell();
                        showToast("+50 vàng! 💰", "success");
                        setModal(null);
                      }}
                      className="px-8 py-3 rounded-2xl bg-gradient-to-r from-yellow-400 to-amber-500 text-amber-900 font-black text-sm shadow-lg hover:scale-105 active:scale-95"
                    >
                      Nhận ngay 🎉
                    </button>
                  </div>
                )}

              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

// ==================== SIDEBAR BUTTON ====================
function SideBtn({ icon, badge, onClick, label, color }: {
  icon: React.ReactNode; badge: number | string | null;
  onClick: () => void; label: string;
  color: "amber" | "blue" | "purple" | "pink";
}) {
  const colors = {
    amber: "from-amber-400 to-yellow-600 border-amber-200",
    blue: "from-blue-400 to-blue-600 border-blue-200",
    purple: "from-purple-400 to-purple-600 border-purple-200",
    pink: "from-pink-400 to-pink-600 border-pink-200",
  };
  return (
    <button
      onClick={onClick}
      className={`relative w-14 h-14 rounded-2xl bg-gradient-to-br ${colors[color]} border-2 flex items-center justify-center text-white shadow-lg hover:scale-110 active:scale-95 transition-transform`}
      title={label}
    >
      {icon}
      {badge !== null && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 rounded-full bg-red-500 border-2 border-white text-white text-[10px] font-black flex items-center justify-center"
        >
          {badge}
        </motion.div>
      )}
    </button>
  );
}
