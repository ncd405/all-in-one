import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  try {
    const url = req.nextUrl.searchParams.get("u");
    const title = (req.nextUrl.searchParams.get("t") || "video").replace(/[^\w\s\u00C0-\u024F\u1E00-\u1EFF]/g, "_").slice(0, 80);
    const format = req.nextUrl.searchParams.get("f") || "video";
    if (!url) return new Response("Missing URL", { status: 400 });

    const headers: Record<string, string> = { "User-Agent": "Mozilla/5.0" };
    const range = req.headers.get("range");
    if (range) headers.Range = range;

    const upstream = await fetch(url, { headers });
    if (!upstream.ok && upstream.status !== 206) return new Response(`Upstream ${upstream.status}`, { status: upstream.status });

    const ext = format === "audio" ? "m4a" : "mp4";
    const h = new Headers();
    h.set("Content-Type", upstream.headers.get("content-type") || (format === "audio" ? "audio/mp4" : "video/mp4"));
    h.set("Content-Disposition", `attachment; filename="${title}.${ext}"`);
    h.set("Accept-Ranges", "bytes");
    h.set("Cache-Control", "no-store");
    const cl = upstream.headers.get("content-length"); if (cl) h.set("Content-Length", cl);
    const cr = upstream.headers.get("content-range"); if (cr) h.set("Content-Range", cr);

    return new Response(upstream.body, { status: upstream.status, headers: h });
  } catch (error: any) {
    return new Response("Proxy error: " + error.message, { status: 500 });
  }
}