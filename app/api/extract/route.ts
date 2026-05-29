import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getExtractor } from "@/lib/extractor";

export const runtime = "nodejs";
export const maxDuration = 60;

// POST /api/extract
// body: { front: dataURL, back?: dataURL }
// 回傳：ExtractionResult（給確認頁預填）
export async function POST(req: Request) {
  // 需登入（即使 middleware 排除了此路徑，仍在此自行驗證）
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: { front?: string; back?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  if (!body.front) {
    return NextResponse.json({ error: "front image required" }, { status: 400 });
  }

  const front = parseDataUrl(body.front);
  const back = body.back ? parseDataUrl(body.back) : undefined;
  if (!front) {
    return NextResponse.json({ error: "invalid front image" }, { status: 400 });
  }

  try {
    const extractor = getExtractor();
    const result = await extractor.extract({
      frontImageBase64: front.data,
      frontMediaType: front.mediaType,
      backImageBase64: back?.data,
      backMediaType: back?.mediaType,
    });
    return NextResponse.json(result);
  } catch (err) {
    console.error("extraction failed", err);
    return NextResponse.json({ error: "extraction failed" }, { status: 500 });
  }
}

function parseDataUrl(dataUrl: string): { mediaType: string; data: string } | null {
  const m = dataUrl.match(/^data:(image\/(?:jpeg|png|webp));base64,(.+)$/);
  if (!m) return null;
  return { mediaType: m[1], data: m[2] };
}
