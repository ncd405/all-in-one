"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, Loader2, Sparkles } from "lucide-react";

interface Message { id: string; role: "user" | "assistant"; content: string; }

export default function AgentChat() {
  const [messages, setMessages] = useState<Message[]>([
    { id: "w", role: "assistant", content: "Xin chào! 👋 Tôi là trợ lý AI của ALL IN ONE. Hỏi tôi bất cứ điều gì về các công cụ!" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
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
        body: JSON.stringify({ message: input }),
      });
      const data = await res.json();
      setMessages((p) => [...p, { id: Date.now() + "a", role: "assistant", content: data.response || data.error || "Lỗi" }]);
    } catch {
      setMessages((p) => [...p, { id: Date.now() + "e", role: "assistant", content: "Không kết nối được." }]);
    } finally { setLoading(false); }
  };

  return (
    <div className="flex flex-col h-[600px] bg-white dark:bg-gray-900 rounded-2xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-800">
      <div className="flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
        <Bot className="w-6 h-6 text-white" />
        <div>
          <h3 className="font-semibold text-white">AI Assistant</h3>
          <p className="text-xs text-white/80 flex items-center gap-1"><Sparkles className="w-3 h-3" /> Luôn sẵn sàng</p>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 dark:bg-gray-950">
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm ${
              m.role === "user"
                ? "bg-indigo-500 text-white rounded-br-none"
                : "bg-white dark:bg-gray-800 rounded-bl-none shadow-sm border border-gray-100 dark:border-gray-700"
            }`}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white dark:bg-gray-800 px-4 py-2.5 rounded-2xl rounded-bl-none shadow-sm">
              <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>
      <div className="p-3 border-t border-gray-200 dark:border-gray-700">
        <div className="flex gap-2">
          <input
            value={input} onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Nhập câu hỏi..." disabled={loading}
            className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
          />
          <button onClick={send} disabled={!input.trim() || loading}
            className="px-4 py-2.5 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white rounded-xl">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}