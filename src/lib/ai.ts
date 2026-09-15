import { ChatOpenAI } from "@langchain/openai";

export async function processAgentMessage(userMessage: string, history: any[] = []) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return { success: false, error: "Chưa cấu hình OPENAI_API_KEY. Vui lòng thêm vào Vercel Environment Variables." };
    }
    const model = new ChatOpenAI({
      modelName: "gpt-4o-mini",
      temperature: 0.7,
      apiKey: process.env.OPENAI_API_KEY,
    });
    const response = await model.invoke([
      { role: "system", content: "Bạn là trợ lý ảo của ALL IN ONE. Hướng dẫn người dùng sử dụng công cụ và trò chơi. Trả lời tiếng Việt, thân thiện, ngắn gọn." },
      ...history,
      { role: "user", content: userMessage },
    ]);
    return { success: true, response: response.content };
  } catch (error: any) {
    console.error("AI error:", error);
    return { success: false, error: "AI Agent gặp sự cố." };
  }
}