import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";
export const maxDuration = 60;

const schema = z.object({
  url: z.string().url("URL không hợp lệ."),
  format: z.enum(["video", "audio"]).default("video"),
  quality: z.enum(["360p", "480p", "720p", "1080p", "best"]).default("720p"),
});

// ===== TẦNG 1: YouTube (pure JS, không binary) =====
async function extractYouTube(url: string, format: string, quality: string) {
  const ytdl = (await import("@distube/ytdl-core")).default;
  if (!ytdl.validateURL(url)) throw new Error("Link YouTube không hợp lệ.");

  const info = await ytdl.getInfo(url);

  let selectedFormat;
  if (format === "audio") {
    selectedFormat = ytdl.chooseFormat(info.formats, { quality: "highestaudio", filter: "audioonly" });
  } else {
    const qm: Record<string, any> = { "360p": "18", "720p": "22", "1080p": "highest", "480p": "highest", "best": "highest" };
    try {
      selectedFormat = qm[quality] !== "highest"
        ? ytdl.chooseFormat(info.formats, { quality: qm[quality] })
        : ytdl.chooseFormat(info.formats, { quality: "highest", filter: "audioandvideo" });
    } catch {
      selectedFormat = ytdl.chooseFormat(info.formats, { filter: "audioandvideo" });
    }
  }
  if (!selectedFormat) throw new Error("Không có định dạng phù hợp.");

  const proxyUrl = `/api/proxy?u=${encodeURIComponent(selectedFormat.url)}&t=${encodeURIComponent(info.videoDetails.title)}&f=${format}`;
  return {
    title: info.videoDetails.title,
    thumbnail: info.videoDetails.thumbnails[0]?.url,
    duration: parseInt(info.videoDetails.lengthSeconds),
    downloadUrl: proxyUrl,
    platform: "youtube",
  };
}

// ===== TẦNG 2: TikTok (TikWM public API) =====
async function extractTikTok(url: string, format: string) {
  const res = await fetch(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}&hd=1`);
  const data = await res.json();
  if (data.code !== 0 || !data.data) throw new Error("Không thể tải video TikTok này.");
  const v = data.data;
  return {
    title: v.title || "TikTok Video",
    thumbnail: v.cover,
    duration: v.duration,
    downloadUrl: format === "audio" ? (v.music || v.play) : (v.hdplay || v.play),
    platform: "tiktok",
  };
}

// ===== ĐIỀU PHỐI =====
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ success: false, error: parsed.error.errors[0].message }, { status: 400 });

    const { url, format, quality } = parsed.data;
    const host = new URL(url).hostname.replace("www.", "");
    let result;

    if (host.includes("youtube.com") || host.includes("youtu.be")) {
      result = await extractYouTube(url, format, quality);
    } else if (host.includes("tiktok.com")) {
      result = await extractTikTok(url, format);
    } else {
      return NextResponse.json({ success: false, error: "Hiện hỗ trợ YouTube và TikTok." }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    console.error("[Adrenaline] Error:", error);
    return NextResponse.json({ success: false, error: error.message || "Không thể xử lý." }, { status: 500 });
  }
}