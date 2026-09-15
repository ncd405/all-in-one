import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

const schema = z.object({
  message: z.string().min(1).max(1000),
  history: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string() })).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ success: false, error: "Dữ liệu không hợp lệ" }, { status: 400 });

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ success: false, error: "Chưa cấu hình OPENAI_API_KEY." });
    }
    const { ChatOpenAI } = await import("@langchain/openai");
    const model = new ChatOpenAI({ modelName: "gpt-4o-mini", temperature: 0.7, apiKey: process.env.OPENAI_API_KEY });
    const response = await model.invoke([
      { role: "system", content: "Bạn là trợ lý ảo của ALL IN ONE. Hướng dẫn người dùng sử dụng công cụ. Trả lời tiếng Việt, ngắn gọn." },
      ...(parsed.data.history || []),
      { role: "user", content: parsed.data.message },
    ]);
    return NextResponse.json({ success: true, response: response.content });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: "Lỗi server" }, { status: 500 });
  }
}