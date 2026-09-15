"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, Loader2, Sparkles, Zap, Brain } from "lucide-react";

type Provider = "openai" | "deepseek";
interface Message { id: string; role: "user" | "assistant"; content: string; provider?: Provider; }

export default function AgentChat() {
  const [messages, setMessages] = useState<Message[]>([
    { id: "w", role: "assistant", content: "Xin chào! 👋 Tôi là AI Agent của ALL IN ONE. Hỏi tôi bất cứ điều gì về công cụ!" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [provider, setProvider] = useState<Provider>("openai");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const um: Message = { id: Date.now().toString(), role: "user", content: input };
    setMessages((p) => [...p, um]);
    setInput(""); setLoading(true);
    try {
      const res = await fetch("/api/ai-agent", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input, provider }),
      });
      const data = await res.json();
      setMessages((p) => [...p, { id: Date.now() + "a", role: "assistant", content: data.response || data.error || "Lỗi", provider: data.provider }]);
    } catch {
      setMessages((p) => [...p, { id: Date.now() + "e", role: "assistant", content: "Không kết nối được." }]);
    } finally { setLoading(false); }
  };

  return (
    <div className="flex flex-col h-[560px] bg-[#141416] rounded-2xl border border-[#26262a] overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-[#26262a]">
        <div className="w-9 h-9 rounded-lg bg-[#22d3ee] flex items-center justify-center">
          <Bot className="w-5 h-5 text-black" strokeWidth={2.25} />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-sm text-white">AI Agent</h3>
          <p className="text-xs text-[#71717a] flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#22d3ee] pulse-cyan" />
            Sẵn sàng
          </p>
        </div>
      </div>

      {/* Provider switch */}
      <div className="flex gap-1 px-3 py-2 border-b border-[#26262a]">
        {(["openai", "deepseek"] as const).map((p) => (
          <button key={p} onClick={() => setProvider(p)}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              provider === p
                ? "bg-[#22d3ee] text-black"
                : "text-[#71717a] hover:text-white hover:bg-[#1a1a1c]"
            }`}>
            {p === "openai" ? <><Zap className="w-3.5 h-3.5" strokeWidth={2.5} /> GPT-4o</> : <><Brain className="w-3.5 h-3.5" strokeWidth={2.5} /> DeepSeek</>}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-[13px] leading-relaxed ${
              m.role === "user"
                ? "bg-[#22d3ee] text-black rounded-br-md font-medium"
                : "bg-[#1a1a1c] text-white rounded-bl-md border border-[#26262a]"
            }`}>
              {m.content}
              {m.provider && (
                <div className="text-[10px] opacity-50 mt-1">
                  via {m.provider === "deepseek" ? "DeepSeek" : "OpenAI"}
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-[#1a1a1c] border border-[#26262a] px-3.5 py-2.5 rounded-2xl rounded-bl-md">
              <Loader2 className="w-4 h-4 animate-spin text-[#22d3ee]" />
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-[#26262a]">
        <div className="flex gap-2">
          <input
            value={input} onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Hỏi AI bất cứ điều gì..."
            disabled={loading}
            className="flex-1 px-3.5 py-2.5 bg-[#0a0a0b] border border-[#26262a] rounded-xl focus:outline-none focus:border-[#22d3ee] text-[13px] text-white placeholder-[#71717a] transition-colors"
          />
          <button onClick={send} disabled={!input.trim() || loading}
            className="px-3.5 py-2.5 bg-[#22d3ee] hover:bg-[#06b6d4] disabled:opacity-30 text-black rounded-xl transition-colors">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" strokeWidth={2.5} />}
          </button>
        </div>
      </div>
    </div>
  );
}
