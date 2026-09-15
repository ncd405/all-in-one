import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";
export const maxDuration = 60;

const schema = z.object({
  message: z.string().min(1).max(2000),
  history: z.array(z.object({
    role: z.enum(["user", "assistant"]),
    content: z.string(),
  })).optional(),
  provider: z.enum(["openai", "deepseek"]).default("openai"),
});

const SYSTEM_PROMPT = "Bạn là trợ lý ảo của ALL IN ONE. Hướng dẫn người dùng sử dụng các công cụ (tải video, MP3, tạo ảnh AI, tính ngày, lịch âm) và trò chơi (nông trại, xếp bài). Trả lời tiếng Việt, thân thiện, ngắn gọn, có emoji nhẹ.";

async function callOpenAI(messages: any[]): Promise<string> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("Chưa cấu hình OPENAI_API_KEY trên Vercel.");

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages,
      temperature: 0.7,
      max_tokens: 1000,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI ${res.status}: ${err.slice(0, 200)}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content || "Không có phản hồi.";
}

async function callDeepSeek(messages: any[]): Promise<string> {
  const key = process.env.DEEPSEEK_API_KEY;
  if (!key) throw new Error("Chưa cấu hình DEEPSEEK_API_KEY trên Vercel.");

  const res = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages,
      temperature: 0.7,
      max_tokens: 1000,
      stream: false,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`DeepSeek ${res.status}: ${err.slice(0, 200)}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content || "Không có phản hồi.";
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { message, history = [], provider } = parsed.data;

    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...history,
      { role: "user", content: message },
    ];

    const response = provider === "deepseek"
      ? await callDeepSeek(messages)
      : await callOpenAI(messages);

    return NextResponse.json({ success: true, response, provider });
  } catch (error: any) {
    console.error("[AI Agent]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Lỗi server." },
      { status: 500 }
    );
  }
}
