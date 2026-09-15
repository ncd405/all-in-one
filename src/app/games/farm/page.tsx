"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Coins, RotateCcw, ShoppingCart, Backpack, ScrollText, Gift, X, Lock,
  Droplets, Scissors, Sprout, Star, Zap, Wheat, Egg, Milk, Flame
} from "lucide-react";

// ==================== 1. GAME TYPES ====================
type CropType = "wheat" | "carrot" | "tomato" | "corn" | "pumpkin";
type AnimalType = "chicken" | "cow";
type ProductType = "wheat" | "carrot" | "tomato" | "corn" | "pumpkin" | "egg" | "milk" | "bread" | "cheese";
type ToolType = CropType | "water" | "sickle" | AnimalType | "feed";
type ModalType = "shop" | "inventory" | "quest" | "orderBoard" | "reward" | "levelup" | null;

interface Plot {
  id: number;
  type: "crop" | "animal";
  crop: CropType | null;
  animal: AnimalType | null;
  plantedAt: number | null;
  watered: boolean;
  fed: boolean;
}

interface GameState {
  gold: number;
  level: number;
  exp: number;
  plots: Plot[];
  inventory: Record<ProductType, number>;
  quests: Quest[];
  orders: Order[];
  skillPoints: number;
  skills: { farmer: number; trader: number; engineer: number };
}

interface Quest {
  id: string; name: string; target: number; progress: number;
  rewardGold: number; rewardExp: number;
  type: "harvest" | "plant" | "water" | "sell" | "feed"; claimed: boolean;
}

interface Order {
  id: string;
  items: { product: ProductType; quantity: number }[];
  rewardGold: number;
  rewardExp: number;
}

// ==================== 2. GAME CONSTANTS ====================
const CROPS: Record<CropType, { name: string; emoji: string; growTime: number; seedCost: number; sellPrice: number; exp: number; levelReq: number }> = {
  wheat:    { name: "Lúa mì",  emoji: "🌾", growTime: 10, seedCost: 3,  sellPrice: 8,   exp: 5,  levelReq: 1 },
  carrot:   { name: "Cà rốt",  emoji: "🥕", growTime: 20, seedCost: 8,  sellPrice: 22,  exp: 10, levelReq: 1 },
  tomato:   { name: "Cà chua", emoji: "🍅", growTime: 35, seedCost: 18, sellPrice: 60,  exp: 25, levelReq: 2 },
  corn:     { name: "Ngô",     emoji: "🌽", growTime: 50, seedCost: 30, sellPrice: 110, exp: 40, levelReq: 3 },
  pumpkin:  { name: "Bí ngô",  emoji: "🎃", growTime: 75, seedCost: 50, sellPrice: 200, exp: 65, levelReq: 4 },
};

const ANIMALS: Record<AnimalType, { name: string; emoji: string; feedCost: number; product: ProductType; productEmoji: string; produceTime: number; sellPrice: number; exp: number; levelReq: number }> = {
  chicken: { name: "Gà", emoji: "🐔", feedCost: 5,  product: "egg",  productEmoji: "🥚", produceTime: 30, sellPrice: 25, exp: 15, levelReq: 1 },
  cow:     { name: "Bò", emoji: "🐄", feedCost: 12, product: "milk", productEmoji: "🥛", produceTime: 60, sellPrice: 70, exp: 35, levelReq: 3 },
};

const RECIPES: Record<string, { name: string; emoji: string; ingredients: { product: ProductType; qty: number }[]; craftTime: number; sellPrice: number; exp: number; levelReq: number }> = {
  bread:  { name: "Bánh mì", emoji: "🍞", ingredients: [{ product: "wheat", qty: 2 }], craftTime: 45, sellPrice: 50,  exp: 30, levelReq: 2 },
  cheese: { name: "Phô mai", emoji: "🧀", ingredients: [{ product: "milk", qty: 2 }],  craftTime: 90, sellPrice: 180, exp: 60, levelReq: 4 },
};

const NUM_PLOTS = 12;
const STORAGE_KEY = "aio-farm-v4";

const expForLvl = (l: number) => 100 + (l - 1) * 75;

function createInitialState(): GameState {
  return {
    gold: 200, level: 1, exp: 0,
    plots: Array.from({ length: NUM_PLOTS }, (_, i) => ({
      id: i,
      type: i < 8 ? "crop" : "animal",
      crop: null, animal: null, plantedAt: null, watered: false, fed: false,
    })),
    inventory: { wheat: 0, carrot: 0, tomato: 0, corn: 0, pumpkin: 0, egg: 0, milk: 0, bread: 0, cheese: 0 },
    quests: [
      { id: "q1", name: "Thu hoạch 5 nông sản", target: 5, progress: 0, rewardGold: 60, rewardExp: 30, type: "harvest", claimed: false },
      { id: "q2", name: "Trồng 3 cây", target: 3, progress: 0, rewardGold: 40, rewardExp: 20, type: "plant", claimed: false },
      { id: "q3", name: "Tưới nước 5 lần", target: 5, progress: 0, rewardGold: 50, rewardExp: 25, type: "water", claimed: false },
      { id: "q4", name: "Cho vật nuôi ăn 3 lần", target: 3, progress: 0, rewardGold: 70, rewardExp: 35, type: "feed", claimed: false },
      { id: "q5", name: "Bán 5 sản phẩm", target: 5, progress: 0, rewardGold: 100, rewardExp: 50, type: "sell", claimed: false },
    ],
    orders: [
      { id: "o1", items: [{ product: "wheat", quantity: 3 }, { product: "egg", quantity: 2 }], rewardGold: 100, rewardExp: 40 },
      { id: "o2", items: [{ product: "bread", quantity: 2 }], rewardGold: 150, rewardExp: 60 },
    ],
    skillPoints: 0, skills: { farmer: 0, trader: 0, engineer: 0 },
  };
}

// ==================== 3. SOUND ENGINE ====================
class SoundFX {
  private ctx: AudioContext | null = null;
  private ensure() {
    if (typeof window === "undefined") return null;
    if (!this.ctx) { try { this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)(); } catch { return null; } }
    return this.ctx;
  }
  private tone(freq: number, dur: number, type: OscillatorType = "sine", vol = 0.08, delay = 0) {
    const ctx = this.ensure(); if (!ctx) return;
    const t = ctx.currentTime + delay;
    const osc = ctx.createOscillator(); const gain = ctx.createGain();
    osc.type = type; osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(0, t); gain.gain.linearRampToValueAtTime(vol, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(gain).connect(ctx.destination); osc.start(t); osc.stop(t + dur);
  }
  plant()   { this.tone(400, 0.15); this.tone(600, 0.1, "sine", 0.05, 0.05); }
  water()   { this.tone(800, 0.1, "triangle", 0.06); this.tone(500, 0.15, "triangle", 0.05, 0.05); }
  harvest() { [523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.2, "sine", 0.08, i * 0.07)); }
  buy()     { this.tone(800, 0.08, "square", 0.04); this.tone(1000, 0.1, "square", 0.04, 0.05); }
  sell()    { [659, 784].forEach((f, i) => this.tone(f, 0.15, "triangle", 0.07, i * 0.08)); }
  levelup() { [523, 659, 784, 1047, 1319].forEach((f, i) => this.tone(f, 0.3, "sine", 0.1, i * 0.1)); }
  error()   { this.tone(300, 0.15, "sawtooth", 0.06); }
  click()   { this.tone(700, 0.05, "sine", 0.04); }
}
const sfx = new SoundFX();

// ==================== 4. MAIN COMPONENT ====================
export default function FarmGameV4() {
  const [game, setGame] = useState<GameState>(createInitialState());
  const [now, setNow] = useState(Date.now());
  const [modal, setModal] = useState<ModalType>(null);
  const [selectedTool, setSelectedTool] = useState<ToolType>("wheat");
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" | "info" } | null>(null);
  const [particles, setParticles] = useState<any[]>([]);
  const [dragState, setDragState] = useState<{ active: boolean; tool: ToolType | null; x: number; y: number; hoverId: number | null }>({ active: false, tool: null, x: 0, y: 0, hoverId: null });
  const [shake, setShake] = useState(false);
  const plotRefs = useRef<Record<number, HTMLDivElement | null>>({});

  // LOAD & SAVE
  useEffect(() => {
    try { const saved = localStorage.getItem(STORAGE_KEY); if (saved) setGame(JSON.parse(saved)); } catch {}
  }, []);
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(game)); } catch {}
  }, [game]);

  // TICK
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 250); return () => clearInterval(t); }, []);

  // HELPERS
  const showToast = (msg: string, type: "success" | "error" | "info" = "info") => {
    setToast({ msg, type }); setTimeout(() => setToast(null), 2000);
  };

  const addExp = (amount: number) => {
    setGame(prev => {
      let newExp = prev.exp + amount; let newLevel = prev.level; let leveled = false;
      while (newExp >= expForLvl(newLevel)) { newExp -= expForLvl(newLevel); newLevel++; leveled = true; }
      if (leveled) setTimeout(() => { setModal("levelup"); sfx.levelup(); setTimeout(() => setModal(null), 2500); }, 400);
      return { ...prev, exp: newExp, level: newLevel, skillPoints: leveled ? prev.skillPoints + 1 : prev.skillPoints };
    });
  };

  const updateQuest = (type: Quest["type"], amount = 1) => {
    setGame(prev => ({ ...prev, quests: prev.quests.map(q => q.type === type && !q.claimed ? { ...q, progress: Math.min(q.target, q.progress + amount) } : q) }));
  };

  const getProgress = useCallback((plot: Plot): number => {
    if (!plot.crop || !plot.plantedAt) return 0;
    const cfg = CROPS[plot.crop];
    const elapsed = (now - plot.plantedAt) / 1000;
    const speed = plot.watered ? 1.5 : 1;
    return Math.min(100, (elapsed * speed / cfg.growTime) * 100);
  }, [now]);

  const getAnimalProgress = useCallback((plot: Plot): number => {
    if (!plot.animal || !plot.plantedAt || !plot.fed) return 0;
    const cfg = ANIMALS[plot.animal];
    const elapsed = (now - plot.plantedAt) / 1000;
    return Math.min(100, (elapsed / cfg.produceTime) * 100);
  }, [now]);

  // PARTICLES
  const spawnParticles = (x: number, y: number, emojis: string[], count = 6) => {
    const arr: { id: string; x: number; y: number; emoji: string; vx: number; vy: number; scale: number }[] = [];
    for (let i = 0; i < count; i++) {
      arr.push({ id: `${Date.now()}-${i}-${Math.random()}`, x, y, emoji: emojis[Math.floor(Math.random() * emojis.length)], vx: (Math.random() - 0.5) * 200, vy: -100 - Math.random() * 150, scale: 0.8 + Math.random() * 0.6 });
    }
    setParticles(p => [...p, ...arr]);
    setTimeout(() => setParticles(p => p.filter(pt => !arr.find(a => a.id === pt.id))), 1400);
  };

  const triggerShake = () => { setShake(true); setTimeout(() => setShake(false), 400); };

  // ACTIONS
  const plantSeed = (id: number, crop: CropType, x?: number, y?: number) => {
    setGame(prev => {
      const plot = prev.plots[id];
      if (plot.crop || plot.animal) { sfx.error(); showToast("Ô này đã có thứ gì đó!", "error"); return prev; }
      const cfg = CROPS[crop];
      if (prev.level < cfg.levelReq) { sfx.error(); showToast(`Cần cấp ${cfg.levelReq}`, "error"); return prev; }
      if (prev.gold < cfg.seedCost) { sfx.error(); showToast(`Cần ${cfg.seedCost} vàng`, "error"); return prev; }
      const plots = [...prev.plots];
      plots[id] = { ...plot, crop, plantedAt: Date.now(), watered: false };
      sfx.plant(); if (x && y) spawnParticles(x, y, ["🌱", "💫", "✨"], 5);
      showToast(`Đã trồng ${cfg.name}!`, "success");
      updateQuest("plant");
      return { ...prev, gold: prev.gold - cfg.seedCost, plots };
    });
  };

  const waterPlot = (id: number, x?: number, y?: number) => {
    setGame(prev => {
      const plot = prev.plots[id];
      if (!plot.crop) { sfx.error(); showToast("Chưa có cây!", "error"); return prev; }
      if (plot.watered) { sfx.error(); showToast("Đã tưới rồi!", "error"); return prev; }
      if (getProgress(plot) >= 100) { sfx.error(); showToast("Cây chín, hãy thu hoạch!", "error"); return prev; }
      const plots = [...prev.plots];
      plots[id] = { ...plot, watered: true };
      sfx.water(); if (x && y) spawnParticles(x, y, ["💧", "💦", "✨"], 8);
      showToast("Đã tưới! +50%", "success");
      updateQuest("water");
      return { ...prev, plots };
    });
  };

  const harvest = (id: number, x?: number, y?: number) => {
    setGame(prev => {
      const plot = prev.plots[id];
      if (!plot.crop || getProgress(plot) < 100) { sfx.error(); showToast("Chưa chín!", "error"); return prev; }
      const cfg = CROPS[plot.crop];
      const plots = [...prev.plots];
      plots[id] = { ...plot, crop: null, plantedAt: null, watered: false };
      const inv = { ...prev.inventory, [plot.crop]: prev.inventory[plot.crop] + 1 };
      sfx.harvest(); triggerShake();
      if (x && y) spawnParticles(x, y, ["🌟", cfg.emoji, "💰", "✨"], 10);
      showToast(`Thu hoạch ${cfg.name}!`, "success");
      updateQuest("harvest");
      return { ...prev, plots, inventory: inv };
    });
  };

  const feedAnimal = (id: number, animal: AnimalType, x?: number, y?: number) => {
    setGame(prev => {
      const plot = prev.plots[id];
      if (plot.animal && plot.fed && getAnimalProgress(plot) < 100) { sfx.error(); showToast("Đã cho ăn rồi!", "error"); return prev; }
      const cfg = ANIMALS[animal];
      if (prev.level < cfg.levelReq) { sfx.error(); showToast(`Cần cấp ${cfg.levelReq}`, "error"); return prev; }
      if (prev.gold < cfg.feedCost) { sfx.error(); showToast(`Cần ${cfg.feedCost} vàng thức ăn`, "error"); return prev; }
      const plots = [...prev.plots];
      plots[id] = { ...plot, animal, plantedAt: Date.now(), fed: true };
      sfx.plant(); if (x && y) spawnParticles(x, y, ["🌾", "✨"], 5);
      showToast(`Đã cho ${cfg.name} ăn!`, "success");
      updateQuest("feed");
      return { ...prev, gold: prev.gold - cfg.feedCost, plots };
    });
  };

  const collectProduct = (id: number, x?: number, y?: number) => {
    setGame(prev => {
      const plot = prev.plots[id];
      if (!plot.animal || getAnimalProgress(plot) < 100) { sfx.error(); showToast("Chưa có sản phẩm!", "error"); return prev; }
      const cfg = ANIMALS[plot.animal];
      const plots = [...prev.plots];
      plots[id] = { ...plot, plantedAt: null, fed: false };
      const inv = { ...prev.inventory, [cfg.product]: prev.inventory[cfg.product] + 1 };
      sfx.harvest(); triggerShake();
      if (x && y) spawnParticles(x, y, ["🌟", cfg.productEmoji, "✨"], 8);
      showToast(`Nhận ${cfg.productEmoji}!`, "success");
      return { ...prev, plots, inventory: inv };
    });
  };

  const sellProduct = (product: ProductType) => {
    setGame(prev => {
      if (prev.inventory[product] <= 0) return prev;
      const price = CROPS[product as CropType]?.sellPrice || ANIMALS["chicken"].sellPrice;
      // Tìm giá thật
      let sellPrice = 0; let exp = 0;
      if (CROPS[product as CropType]) { sellPrice = CROPS[product as CropType].sellPrice; exp = CROPS[product as CropType].exp; }
      else if (product === "egg") { sellPrice = 25; exp = 15; }
      else if (product === "milk") { sellPrice = 70; exp = 35; }
      else if (product === "bread") { sellPrice = 50; exp = 30; }
      else if (product === "cheese") { sellPrice = 180; exp = 60; }
      
      const inv = { ...prev.inventory, [product]: prev.inventory[product] - 1 };
      sfx.sell();
      showToast(`+${sellPrice} vàng!`, "success");
      updateQuest("sell");
      addExp(exp);
      return { ...prev, gold: prev.gold + sellPrice, inventory: inv };
    });
  };

  const sellAll = () => {
    setGame(prev => {
      let total = 0, totalExp = 0, sold = 0;
      const inv = { ...prev.inventory };
      (Object.keys(inv) as ProductType[]).forEach(k => {
        if (inv[k] > 0) {
          let price = 0, exp = 0;
          if (CROPS[k as CropType]) { price = CROPS[k as CropType].sellPrice; exp = CROPS[k as CropType].exp; }
          else if (k === "egg") { price = 25; exp = 15; }
          else if (k === "milk") { price = 70; exp = 35; }
          else if (k === "bread") { price = 50; exp = 30; }
          else if (k === "cheese") { price = 180; exp = 60; }
          total += price * inv[k]; totalExp += exp * inv[k]; sold += inv[k];
          inv[k] = 0;
        }
      });
      if (sold === 0) return prev;
      sfx.sell(); triggerShake();
      showToast(`+${total} vàng! 💰`, "success");
      updateQuest("sell", sold);
      addExp(totalExp);
      return { ...prev, gold: prev.gold + total, inventory: inv };
    });
  };

  const claimQuest = (id: string) => {
    setGame(prev => {
      const q = prev.quests.find(x => x.id === id);
      if (!q || q.claimed || q.progress < q.target) return prev;
      sfx.buy();
      showToast(`+${q.rewardGold}💰 +${q.rewardExp}⭐`, "success");
      addExp(q.rewardExp);
      return { ...prev, gold: prev.gold + q.rewardGold, quests: prev.quests.map(x => x.id === id ? { ...x, claimed: true } : x) };
    });
  };

  const completeOrder = (orderId: string) => {
    setGame(prev => {
      const order = prev.orders.find(o => o.id === orderId);
      if (!order) return prev;
      for (const item of order.items) {
        if (prev.inventory[item.product] < item.quantity) { sfx.error(); showToast(`Không đủ ${item.product}!`, "error"); return prev; }
      }
      const inv = { ...prev.inventory };
      order.items.forEach(item => { inv[item.product] -= item.quantity; });
      const newOrder = { ...order, id: `o${Date.now()}`, rewardGold: Math.floor(order.rewardGold * 1.2), rewardExp: Math.floor(order.rewardExp * 1.2) };
      sfx.sell(); triggerShake();
      showToast(`Hoàn thành đơn! +${order.rewardGold}💰`, "success");
      addExp(order.rewardExp);
      return { ...prev, gold: prev.gold + order.rewardGold, inventory: inv, orders: prev.orders.map(o => o.id === orderId ? newOrder : o) };
    });
  };

  const craft = (recipeKey: string) => {
    setGame(prev => {
      const recipe = RECIPES[recipeKey];
      if (!recipe) return prev;
      if (prev.level < recipe.levelReq) { sfx.error(); showToast(`Cần cấp ${recipe.levelReq}`, "error"); return prev; }
      for (const ing of recipe.ingredients) {
        if (prev.inventory[ing.product] < ing.qty) { sfx.error(); showToast(`Thiếu ${ing.product}!`, "error"); return prev; }
      }
      const inv = { ...prev.inventory };
      recipe.ingredients.forEach(ing => { inv[ing.product] -= ing.qty; });
      inv[recipeKey as ProductType] = (inv[recipeKey as ProductType] || 0) + 1;
      sfx.buy();
      showToast(`Chế biến ${recipe.name}!`, "success");
      addExp(recipe.exp);
      return { ...prev, inventory: inv };
    });
  };

  const resetGame = () => {
    if (!confirm("Chơi lại từ đầu?")) return;
    setGame(createInitialState());
    localStorage.removeItem(STORAGE_KEY);
    showToast("Đã chơi lại!", "info");
  };

  // DRAG
  const findPlot = (x: number, y: number): number | null => {
    for (const [id, el] of Object.entries(plotRefs.current)) {
      if (!el) continue;
      const r = el.getBoundingClientRect();
      if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) return Number(id);
    }
    return null;
  };

  const onPointerDown = (e: React.PointerEvent, tool: ToolType) => {
    e.preventDefault(); sfx.click();
    setDragState({ active: true, tool, x: e.clientX, y: e.clientY, hoverId: null });
  };

  useEffect(() => {
    if (!dragState.active) return;
    const move = (e: PointerEvent) => setDragState(d => ({ ...d, x: e.clientX, y: e.clientY, hoverId: findPlot(e.clientX, e.clientY) }));
    const up = (e: PointerEvent) => {
      const id = findPlot(e.clientX, e.clientY);
      if (id !== null && dragState.tool) {
        const el = plotRefs.current[id];
        const r = el?.getBoundingClientRect();
        const cx = r ? r.left + r.width / 2 : e.clientX;
        const cy = r ? r.top + r.height / 2 : e.clientY;
        const tool = dragState.tool;
        if (tool === "water") waterPlot(id, cx, cy);
        else if (tool === "sickle") {
          const plot = game.plots[id];
          if (plot.type === "animal") collectProduct(id, cx, cy);
          else harvest(id, cx, cy);
        }
        else if (tool === "feed") { /* handled by animal select */ }
        else if (tool === "chicken" || tool === "cow") feedAnimal(id, tool as AnimalType, cx, cy);
        else plantSeed(id, tool as CropType, cx, cy);
      }
      setDragState({ active: false, tool: null, x: 0, y: 0, hoverId: null });
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); };
  }, [dragState.active, dragState.tool, game]);

  const expNeed = expForLvl(game.level);
  const expPct = (game.exp / expNeed) * 100;
  const toolEmoji = (t: ToolType) => {
    if (t === "water") return "💧";
    if (t === "sickle") return "✂️";
    if (t === "feed") return "🍽️";
    if (ANIMALS[t as AnimalType]) return ANIMALS[t as AnimalType].emoji;
    return CROPS[t as CropType]?.emoji || "❓";
  };
  const totalInv = Object.values(game.inventory).reduce((a, b) => a + b, 0);
  const availableQuests = game.quests.filter(q => q.progress >= q.target && !q.claimed).length;

  // RENDER
  return (
    <main className="min-h-screen relative overflow-hidden select-none touch-none" style={{ background: "linear-gradient(to bottom, #87CEEB 0%, #B0E0E6 30%, #A8D5BA 60%, #7CB342 100%)" }}>
      {/* Sky */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 60, repeat: Infinity, ease: "linear" }} className="absolute top-8 right-8 w-16 h-16 rounded-full bg-yellow-300 shadow-[0_0_60px_20px_rgba(253,224,71,0.5)]" />
        <motion.div animate={{ x: [0, 30, 0] }} transition={{ duration: 20, repeat: Infinity }} className="absolute top-12 left-10 text-5xl opacity-80">☁️</motion.div>
        <motion.div animate={{ x: [0, -40, 0] }} transition={{ duration: 25, repeat: Infinity }} className="absolute top-24 right-32 text-4xl opacity-70">☁️</motion.div>
      </div>

      <motion.div animate={shake ? { x: [0, -6, 6, -4, 4, 0] } : {}} transition={{ duration: 0.4 }} className="relative z-10">

        {/* HUD */}
        <div className="p-3">
          <div className="max-w-3xl mx-auto flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 bg-white/95 rounded-2xl p-1.5 pr-3 shadow-lg border-2 border-yellow-300">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-white font-black text-lg border-2 border-yellow-200">{game.level}</div>
              <div className="min-w-[100px]">
                <div className="text-[10px] font-bold text-amber-800 uppercase">Trang trại</div>
                <div className="h-2 bg-amber-200 rounded-full overflow-hidden mt-0.5">
                  <motion.div className="h-full bg-gradient-to-r from-green-400 to-lime-500" animate={{ width: `${expPct}%` }} />
                </div>
                <div className="text-[9px] text-amber-700 font-semibold mt-0.5">{game.exp}/{expNeed} XP · {game.skillPoints}⭐</div>
              </div>
            </div>
            <motion.div key={game.gold} initial={{ scale: 1 }} animate={{ scale: [1, 1.08, 1] }} transition={{ duration: 0.3 }} className="flex items-center gap-1.5 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-2xl px-4 py-2.5 shadow-lg border-2 border-yellow-200">
              <Coins className="w-5 h-5 text-white drop-shadow" strokeWidth={2.5} />
              <span className="text-white font-black text-lg drop-shadow">{game.gold.toLocaleString()}</span>
            </motion.div>
          </div>
        </div>

        {/* GRID */}
        <div className="max-w-3xl mx-auto px-3 pb-36">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <div className="grid grid-cols-4 gap-2 md:gap-2.5 pt-4">
                {game.plots.map((plot, idx) => {
                  const isCrop = plot.type === "crop";
                  const pct = isCrop ? getProgress(plot) : getAnimalProgress(plot);
                  const ready = pct >= 100;
                  const isHovered = dragState.active && dragState.hoverId === plot.id;
                  const canDrop = isHovered && dragState.tool && (
                    (dragState.tool === "water" && isCrop && plot.crop && !plot.watered && !ready) ||
                    (dragState.tool === "sickle" && ((isCrop && plot.crop && ready) || (!isCrop && plot.animal && ready))) ||
                    (isCrop && !plot.crop && CROPS[dragState.tool as CropType]) ||
                    (!isCrop && !plot.animal && ANIMALS[dragState.tool as AnimalType])
                  );

                  return (
                    <motion.div
                      key={plot.id}
                      ref={el => { plotRefs.current[plot.id] = el; }}
                      initial={{ scale: 0, rotate: -20 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ delay: idx * 0.03, type: "spring", bounce: 0.5 }}
                      whileHover={{ y: -4 }}
                      className={`relative aspect-square rounded-2xl ${isHovered ? (canDrop ? "ring-4 ring-green-400 scale-105" : "ring-4 ring-red-400") : ""}`}
                      style={{
                        background: isCrop ? "linear-gradient(145deg, #8B5A2B 0%, #6D4420 100%)" : "linear-gradient(145deg, #A0A0A0 0%, #707070 100%)",
                        boxShadow: isHovered && canDrop ? "0 0 30px rgba(74,222,128,0.9)" : "0 5px 0 #3A2410, inset 0 2px 4px rgba(255,255,255,0.15), inset 0 -2px 4px rgba(0,0,0,0.3)",
                      }}
                    >
                      <div className="absolute inset-1.5 rounded-xl flex items-center justify-center" style={{
                        background: isCrop
                          ? "radial-gradient(circle at 30% 30%, #9B6935 0%, #7A4A1F 60%, #5D3712 100%)"
                          : "radial-gradient(circle at 30% 30%, #B8B8B8 0%, #888 60%, #666 100%)",
                        boxShadow: "inset 0 3px 6px rgba(0,0,0,0.3)",
                      }}>
                        {isCrop ? (
                          !plot.crop ? <span className="text-2xl opacity-40">🌱</span>
                          : ready ? <motion.div animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 1.2, repeat: Infinity }} className="text-3xl md:text-4xl drop-shadow-lg">{CROPS[plot.crop].emoji}</motion.div>
                          : <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 2, repeat: Infinity }} className="text-2xl">{pct < 30 ? "🌱" : pct < 70 ? "🌿" : "🌾"}</motion.div>
                        ) : (
                          !plot.animal ? <span className="text-2xl opacity-40">🏠</span>
                          : ready ? <motion.div animate={{ y: [0, -5, 0] }} transition={{ duration: 1, repeat: Infinity }} className="text-3xl md:text-4xl">{ANIMALS[plot.animal].productEmoji}</motion.div>
                          : <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 2, repeat: Infinity }} className="text-2xl">{ANIMALS[plot.animal].emoji}</motion.div>
                        )}
                        {plot.animal && plot.fed && !ready && <div className="absolute top-1 right-1 text-[10px]">🍽️</div>}
                        {plot.crop && !ready && (
                          <div className="absolute bottom-1 left-1 right-1 h-1 bg-black/50 rounded-full overflow-hidden">
                            <motion.div className="h-full bg-gradient-to-r from-green-400 to-yellow-400" animate={{ width: `${pct}%` }} />
                          </div>
                        )}
                      </div>
                      {ready && <motion.div animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 1, repeat: Infinity }} className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-gradient-to-br from-yellow-300 to-yellow-500 border-2 border-white flex items-center justify-center text-xs font-black text-yellow-900 shadow-lg">!</motion.div>}
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* SIDEBAR */}
            <div className="flex flex-col gap-2 pt-4">
              <SideBtn icon={<ShoppingCart className="w-5 h-5" />} badge={null} onClick={() => { sfx.click(); setModal("shop"); }} color="amber" />
              <SideBtn icon={<Backpack className="w-5 h-5" />} badge={totalInv || null} onClick={() => { sfx.click(); setModal("inventory"); }} color="blue" />
              <SideBtn icon={<ScrollText className="w-5 h-5" />} badge={availableQuests || null} onClick={() => { sfx.click(); setModal("quest"); }} color="purple" />
              <SideBtn icon={<Wheat className="w-5 h-5" />} badge={game.orders.length || null} onClick={() => { sfx.click(); setModal("orderBoard"); }} color="green" />
              <SideBtn icon={<Gift className="w-5 h-5" />} badge="!" onClick={() => { sfx.click(); setModal("reward"); }} color="pink" />
              <button onClick={resetGame} className="w-12 h-12 rounded-2xl bg-gradient-to-br from-gray-500 to-gray-700 border-2 border-gray-300 flex items-center justify-center text-white shadow-lg hover:scale-105">
                <RotateCcw className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* HINT */}
      <div className="fixed bottom-32 left-1/2 -translate-x-1/2 z-10 px-4 py-2 rounded-full bg-yellow-200/90 backdrop-blur border-2 border-yellow-400 text-xs font-bold text-amber-900 shadow-lg">👆 Kéo công cụ xuống đất</div>

      {/* TOOLBAR */}
      <div className="fixed bottom-0 left-0 right-0 z-20 p-2 pb-3" style={{ background: "linear-gradient(to top, rgba(101,67,33,0.98) 0%, transparent 100%)" }}>
        <div className="max-w-3xl mx-auto flex gap-1.5 justify-center overflow-x-auto pb-1">
          {(Object.keys(CROPS) as CropType[]).map((key) => {
            const c = CROPS[key];
            const locked = game.level < c.levelReq;
            const selected = selectedTool === key;
            return (
              <button key={key} onPointerDown={(e) => !locked && onPointerDown(e, key)} onClick={() => !locked && setSelectedTool(key)}
                className={`relative shrink-0 w-14 h-14 rounded-2xl border-2 flex flex-col items-center justify-center touch-none transition-all ${
                  locked ? "bg-gray-700/80 border-gray-500 opacity-60"
                  : selected ? "bg-gradient-to-br from-yellow-300 to-yellow-500 border-yellow-100 scale-110 shadow-xl"
                  : "bg-gradient-to-br from-amber-600 to-amber-800 border-amber-400 hover:scale-105"
                }`}>
                <div className="text-2xl">{locked ? <Lock className="w-5 h-5 text-gray-300" /> : c.emoji}</div>
                {!locked && <div className="text-[8px] font-bold text-white mt-0.5">{c.seedCost}💰</div>}
              </button>
            );
          })}
          {(Object.keys(ANIMALS) as AnimalType[]).map((key) => {
            const a = ANIMALS[key];
            const locked = game.level < a.levelReq;
            const selected = selectedTool === key;
            return (
              <button key={key} onPointerDown={(e) => !locked && onPointerDown(e, key)} onClick={() => !locked && setSelectedTool(key)}
                className={`relative shrink-0 w-14 h-14 rounded-2xl border-2 flex flex-col items-center justify-center touch-none transition-all ${
                  locked ? "bg-gray-700/80 border-gray-500 opacity-60"
                  : selected ? "bg-gradient-to-br from-orange-300 to-orange-500 border-orange-100 scale-110 shadow-xl"
                  : "bg-gradient-to-br from-orange-700 to-red-700 border-orange-400 hover:scale-105"
                }`}>
                <div className="text-2xl">{locked ? <Lock className="w-5 h-5 text-gray-300" /> : a.emoji}</div>
                {!locked && <div className="text-[8px] font-bold text-white mt-0.5">{a.feedCost}💰</div>}
              </button>
            );
          })}
          <button onPointerDown={(e) => onPointerDown(e, "water")} onClick={() => setSelectedTool("water")}
            className={`shrink-0 w-14 h-14 rounded-2xl border-2 flex flex-col items-center justify-center touch-none transition-all ${
              selectedTool === "water" ? "bg-gradient-to-br from-blue-400 to-blue-600 border-blue-200 scale-110" : "bg-gradient-to-br from-blue-500 to-blue-700 border-blue-300 hover:scale-105"
            }`}>
            <Droplets className="w-6 h-6 text-white" />
            <div className="text-[8px] font-bold text-white mt-0.5">Tưới</div>
          </button>
          <button onPointerDown={(e) => onPointerDown(e, "sickle")} onClick={() => setSelectedTool("sickle")}
            className={`shrink-0 w-14 h-14 rounded-2xl border-2 flex flex-col items-center justify-center touch-none transition-all ${
              selectedTool === "sickle" ? "bg-gradient-to-br from-rose-400 to-rose-600 border-rose-200 scale-110" : "bg-gradient-to-br from-rose-500 to-rose-700 border-rose-300 hover:scale-105"
            }`}>
            <Scissors className="w-6 h-6 text-white" />
            <div className="text-[8px] font-bold text-white mt-0.5">Thu</div>
          </button>
        </div>
      </div>

      {/* DRAG GHOST */}
      <AnimatePresence>
        {dragState.active && dragState.tool && (
          <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1.5, opacity: 1 }} exit={{ scale: 0, opacity: 0 }}
            className="fixed pointer-events-none z-50 text-5xl"
            style={{ left: dragState.x, top: dragState.y, transform: "translate(-50%, -50%)", filter: "drop-shadow(0 0 15px white) drop-shadow(0 0 30px rgba(253,224,71,0.8))" }}>
            {toolEmoji(dragState.tool)}
          </motion.div>
        )}
      </AnimatePresence>

      {/* PARTICLES */}
      <AnimatePresence>
        {particles.map((p: any) => (
          <motion.div key={p.id} initial={{ opacity: 1, scale: 0, x: p.x, y: p.y }}
            animate={{ opacity: 0, scale: p.scale, x: p.x + p.vx, y: p.y + p.vy, rotate: [0, 360] }}
            exit={{ opacity: 0 }} transition={{ duration: 1.2 }}
            className="fixed pointer-events-none z-40 text-2xl" style={{ left: 0, top: 0 }}>
            {p.emoji}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* TOAST */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className={`fixed top-24 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl shadow-2xl text-sm font-bold ${
              toast.type === "success" ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white"
              : toast.type === "error" ? "bg-gradient-to-r from-red-500 to-rose-600 text-white"
              : "bg-gray-800 text-white"
            }`}>
            {toast.type === "success" ? "✅" : toast.type === "error" ? "❌" : "ℹ️"} {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* LEVEL UP */}
      <AnimatePresence>
        {modal === "levelup" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] flex items-center justify-center pointer-events-none">
            <motion.div initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 1.5, opacity: 0 }} transition={{ type: "spring" }} className="text-center">
              <motion.div animate={{ y: [0, -20, 0] }} transition={{ duration: 1, repeat: Infinity }} className="text-9xl mb-2">⭐</motion.div>
              <div className="bg-gradient-to-r from-yellow-400 to-amber-500 px-8 py-3 rounded-2xl shadow-2xl border-4 border-white">
                <div className="text-xs font-bold text-amber-900 uppercase">Lên cấp</div>
                <div className="text-5xl font-black text-white">{game.level}</div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODALS */}
      <AnimatePresence>
        {modal && modal !== "levelup" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 flex items-end sm:items-center justify-center" onClick={() => setModal(null)}>
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25 }}
              className="bg-gradient-to-b from-amber-50 to-yellow-100 rounded-t-3xl sm:rounded-3xl shadow-2xl border-t-4 sm:border-4 border-yellow-600 w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col"
              onClick={e => e.stopPropagation()}>
              <div className="sm:hidden flex justify-center pt-2"><div className="w-12 h-1.5 rounded-full bg-amber-700/30" /></div>
              <div className="px-5 py-4 flex items-center justify-between border-b-2 border-amber-300">
                <h2 className="text-xl font-black text-amber-900 flex items-center gap-2">
                  {modal === "shop" && <><ShoppingCart className="w-5 h-5" /> Cửa hàng</>}
                  {modal === "inventory" && <><Backpack className="w-5 h-5" /> Kho hàng</>}
                  {modal === "quest" && <><ScrollText className="w-5 h-5" /> Nhiệm vụ</>}
                  {modal === "orderBoard" && <><Wheat className="w-5 h-5" /> Đơn hàng</>}
                  {modal === "reward" && <><Gift className="w-5 h-5" /> Thưởng</>}
                </h2>
                <button onClick={() => setModal(null)} className="w-9 h-9 rounded-full bg-amber-200 hover:bg-amber-300 flex items-center justify-center"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-4 overflow-y-auto flex-1">

                {modal === "shop" && (
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-black text-amber-900 text-sm mb-2">🌱 Hạt giống</h3>
                      <div className="grid grid-cols-2 gap-2">
                        {(Object.keys(CROPS) as CropType[]).map(k => {
                          const c = CROPS[k]; const locked = game.level < c.levelReq; const canAfford = game.gold >= c.seedCost;
                          return (
                            <div key={k} className="rounded-xl p-2.5 border-2 border-amber-300 bg-white">
                              <div className="text-3xl text-center">{c.emoji}</div>
                              <div className="text-center font-bold text-xs text-amber-900">{c.name}</div>
                              <div className="text-[10px] text-center text-gray-500">⏱{c.growTime}s</div>
                              <div className="text-center text-red-600 font-black text-sm mt-1">{c.seedCost}💰</div>
                              <button disabled={locked || !canAfford}
                                onClick={() => { setGame(p => ({ ...p, gold: p.gold - c.seedCost, inventory: { ...p.inventory, [k]: p.inventory[k] + 1 } })); sfx.buy(); showToast(`Mua ${c.name}!`, "success"); }}
                                className={`w-full mt-1.5 py-1 rounded-lg text-[10px] font-black ${locked || !canAfford ? "bg-gray-300 text-gray-500" : "bg-green-500 text-white"}`}>
                                {locked ? `Cấp ${c.levelReq}` : canAfford ? "Mua" : "Thiếu 💰"}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    <div>
                      <h3 className="font-black text-amber-900 text-sm mb-2">🐔 Vật nuôi</h3>
                      <div className="grid grid-cols-2 gap-2">
                        {(Object.keys(ANIMALS) as AnimalType[]).map(k => {
                          const a = ANIMALS[k]; const locked = game.level < a.levelReq; const canAfford = game.gold >= a.feedCost;
                          return (
                            <div key={k} className="rounded-xl p-2.5 border-2 border-orange-300 bg-white">
                              <div className="text-3xl text-center">{a.emoji}</div>
                              <div className="text-center font-bold text-xs text-amber-900">{a.name}</div>
                              <div className="text-[10px] text-center text-gray-500">{a.productEmoji} · {a.produceTime}s</div>
                              <div className="text-center text-red-600 font-black text-sm mt-1">{a.feedCost}💰</div>
                              <button disabled={locked || !canAfford}
                                onClick={() => { setGame(p => ({ ...p, gold: p.gold - a.feedCost, inventory: { ...p.inventory, [a.product]: p.inventory[a.product] + 1 } })); sfx.buy(); showToast(`Mua ${a.name}!`, "success"); }}
                                className={`w-full mt-1.5 py-1 rounded-lg text-[10px] font-black ${locked || !canAfford ? "bg-gray-300 text-gray-500" : "bg-orange-500 text-white"}`}>
                                {locked ? `Cấp ${a.levelReq}` : canAfford ? "Mua" : "Thiếu 💰"}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    <div>
                      <h3 className="font-black text-amber-900 text-sm mb-2">🍞 Chế biến</h3>
                      <div className="grid grid-cols-2 gap-2">
                        {Object.entries(RECIPES).map(([key, r]) => {
                          const locked = game.level < r.levelReq;
                          const canCraft = r.ingredients.every(ing => game.inventory[ing.product] >= ing.qty);
                          return (
                            <div key={key} className="rounded-xl p-2.5 border-2 border-pink-300 bg-white">
                              <div className="text-3xl text-center">{r.emoji}</div>
                              <div className="text-center font-bold text-xs text-amber-900">{r.name}</div>
                              <div className="text-[9px] text-center text-gray-500">{r.ingredients.map(i => `${i.qty}${i.product}`).join(" + ")}</div>
                              <div className="text-center text-green-600 font-black text-sm mt-1">{r.sellPrice}💰</div>
                              <button disabled={locked || !canCraft} onClick={() => craft(key)}
                                className={`w-full mt-1.5 py-1 rounded-lg text-[10px] font-black ${locked || !canCraft ? "bg-gray-300 text-gray-500" : "bg-pink-500 text-white"}`}>
                                {locked ? `Cấp ${r.levelReq}` : canCraft ? "Chế biến" : "Thiếu NL"}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {modal === "inventory" && (
                  <div>
                    {totalInv === 0 ? (
                      <div className="text-center py-12"><Backpack className="w-16 h-16 mx-auto mb-3 text-amber-300" /><p className="text-amber-700 font-bold">Kho trống</p></div>
                    ) : (
                      <>
                        <div className="grid grid-cols-3 gap-2 mb-4">
                          {(Object.keys(game.inventory) as ProductType[]).map(k => {
                            if (game.inventory[k] === 0) return null;
                            let emoji: string = "❓"; let name: string = String(k);
                            if (CROPS[k as CropType]) { emoji = CROPS[k as CropType].emoji; name = CROPS[k as CropType].name; }
                            else if (k === "egg") { emoji = "🥚"; name = "Trứng"; }
                            else if (k === "milk") { emoji = "🥛"; name = "Sữa"; }
                            else if (k === "bread") { emoji = "🍞"; name = "Bánh mì"; }
                            else if (k === "cheese") { emoji = "🧀"; name = "Phô mai"; }
                            return (
                              <div key={k} className="rounded-xl p-2 border-2 border-amber-300 bg-white text-center">
                                <div className="text-3xl">{emoji}</div>
                                <div className="font-bold text-[10px] text-amber-900">{name}</div>
                                <div className="text-[10px] text-gray-500">x{game.inventory[k]}</div>
                                <button onClick={() => sellProduct(k)} className="w-full mt-1 py-1 rounded-lg bg-yellow-400 text-amber-900 text-[10px] font-black">Bán</button>
                              </div>
                            );
                          })}
                        </div>
                        <button onClick={sellAll} className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 text-white font-black flex items-center justify-center gap-2">
                          <Zap className="w-4 h-4" /> Bán tất cả
                        </button>
                      </>
                    )}
                  </div>
                )}

                {modal === "quest" && (
                  <div className="space-y-2">
                    {game.quests.map(q => {
                      const done = q.progress >= q.target;
                      return (
                        <div key={q.id} className={`rounded-xl p-3 border-2 bg-white ${q.claimed ? "border-gray-300 opacity-60" : done ? "border-green-400" : "border-amber-300"}`}>
                          <div className="flex justify-between mb-1">
                            <div><div className="font-black text-sm text-amber-900">{q.name}</div><div className="text-[10px] text-gray-500">{q.progress}/{q.target}</div></div>
                            <div className="text-right text-[10px]"><div className="text-yellow-600 font-black">+{q.rewardGold}💰</div><div className="text-purple-600 font-bold">+{q.rewardExp}⭐</div></div>
                          </div>
                          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden mb-1.5">
                            <div className="h-full bg-gradient-to-r from-green-400 to-emerald-500 transition-all" style={{ width: `${(q.progress / q.target) * 100}%` }} />
                          </div>
                          <button disabled={!done || q.claimed} onClick={() => claimQuest(q.id)}
                            className={`w-full py-1.5 rounded-lg text-[11px] font-black ${q.claimed ? "bg-gray-200 text-gray-500" : done ? "bg-green-500 text-white" : "bg-gray-200 text-gray-400"}`}>
                            {q.claimed ? "✓ Đã nhận" : done ? "Nhận thưởng" : "Chưa xong"}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {modal === "orderBoard" && (
                  <div className="space-y-3">
                    {game.orders.map(order => {
                      const canComplete = order.items.every(item => game.inventory[item.product] >= item.quantity);
                      return (
                        <div key={order.id} className="rounded-2xl p-3 border-2 border-green-400 bg-white">
                          <div className="flex justify-between mb-2">
                            <span className="font-black text-sm text-amber-900">📋 Đơn hàng</span>
                            <div className="text-[10px] text-right"><div className="text-yellow-600 font-black">+{order.rewardGold}💰</div><div className="text-purple-600 font-bold">+{order.rewardExp}⭐</div></div>
                          </div>
                          <div className="flex flex-wrap gap-2 mb-2">
                            {order.items.map((item, i) => {
                              let emoji = "❓";
                              if (CROPS[item.product as CropType]) emoji = CROPS[item.product as CropType].emoji;
                              else if (item.product === "egg") emoji = "🥚";
                              else if (item.product === "milk") emoji = "🥛";
                              else if (item.product === "bread") emoji = "🍞";
                              else if (item.product === "cheese") emoji = "🧀";
                              const has = game.inventory[item.product] >= item.quantity;
                              return (
                                <div key={i} className={`px-2 py-1 rounded-lg text-xs font-bold ${has ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                                  {emoji} {game.inventory[item.product]}/{item.quantity}
                                </div>
                              );
                            })}
                          </div>
                          <button disabled={!canComplete} onClick={() => completeOrder(order.id)}
                            className={`w-full py-2 rounded-xl text-xs font-black ${canComplete ? "bg-green-500 text-white" : "bg-gray-200 text-gray-400"}`}>
                            {canComplete ? "Giao hàng" : "Chưa đủ hàng"}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {modal === "reward" && (
                  <div className="text-center py-4">
                    <motion.div animate={{ rotate: [0, -10, 10, 0], scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }} className="text-7xl mb-3">🎁</motion.div>
                    <h3 className="font-black text-lg text-amber-900 mb-1">Quà tặng</h3>
                    <p className="text-sm text-amber-700 mb-5">Nhận 100 vàng miễn phí!</p>
                    <button onClick={() => { setGame(p => ({ ...p, gold: p.gold + 100 })); sfx.sell(); showToast("+100 vàng!", "success"); setModal(null); }}
                      className="px-8 py-3 rounded-2xl bg-gradient-to-r from-yellow-400 to-amber-500 text-amber-900 font-black text-sm">Nhận 🎉</button>
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

// SIDEBAR BUTTON
function SideBtn({ icon, badge, onClick, color }: { icon: React.ReactNode; badge: number | string | null; onClick: () => void; color: "amber" | "blue" | "purple" | "pink" | "green"; }) {
  const c = { amber: "from-amber-400 to-yellow-600 border-amber-200", blue: "from-blue-400 to-blue-600 border-blue-200", purple: "from-purple-400 to-purple-600 border-purple-200", pink: "from-pink-400 to-pink-600 border-pink-200", green: "from-green-400 to-emerald-600 border-green-200" };
  return (
    <button onClick={onClick} className={`relative w-12 h-12 rounded-2xl bg-gradient-to-br ${c[color]} border-2 flex items-center justify-center text-white shadow-lg hover:scale-110 active:scale-95 transition-transform`}>
      {icon}
      {badge !== null && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -top-1 -right-1 min-w-[18px] h-4 px-1 rounded-full bg-red-500 border-2 border-white text-white text-[9px] font-black flex items-center justify-center">{badge}</motion.div>}
    </button>
  );
}
