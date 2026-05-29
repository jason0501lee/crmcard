import Anthropic from "@anthropic-ai/sdk";
import type { CardExtractor } from "./index";
import type { ExtractionResult } from "@/lib/types";
import { EXTRACTION_SYSTEM_PROMPT } from "./prompt";

const MODEL = "claude-sonnet-4-6"; // Vision；質量/成本平衡，可調整

export class ClaudeExtractor implements CardExtractor {
  private client: Anthropic;

  constructor() {
    this.client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }

  async extract(input: {
    frontImageBase64: string;
    frontMediaType: string;
    backImageBase64?: string;
    backMediaType?: string;
  }): Promise<ExtractionResult> {
    const content: Anthropic.MessageParam["content"] = [
      { type: "text", text: "名片正面：" },
      {
        type: "image",
        source: {
          type: "base64",
          media_type: input.frontMediaType as "image/jpeg" | "image/png" | "image/webp",
          data: input.frontImageBase64,
        },
      },
    ];

    if (input.backImageBase64 && input.backMediaType) {
      content.push({ type: "text", text: "名片背面：" });
      content.push({
        type: "image",
        source: {
          type: "base64",
          media_type: input.backMediaType as "image/jpeg" | "image/png" | "image/webp",
          data: input.backImageBase64,
        },
      });
    }

    const msg = await this.client.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: EXTRACTION_SYSTEM_PROMPT,
      messages: [{ role: "user", content }],
    });

    const text = msg.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim();

    return parseExtraction(text);
  }
}

// 容錯解析：去除可能的 markdown 圍欄後解析，並補齊缺欄位
function parseExtraction(raw: string): ExtractionResult {
  let jsonStr = raw;
  const fence = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) jsonStr = fence[1].trim();

  let parsed: Partial<ExtractionResult> = {};
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    // 解析失敗則回傳空結構，由確認頁讓使用者手動填
    parsed = {};
  }

  return {
    full_name: parsed.full_name ?? null,
    title: parsed.title ?? null,
    company: parsed.company ?? null,
    email: parsed.email ?? null,
    website: parsed.website ?? null,
    address: parsed.address ?? null,
    phones: Array.isArray(parsed.phones) ? parsed.phones : [],
    social_links: Array.isArray(parsed.social_links) ? parsed.social_links : [],
    confidence: parsed.confidence ?? {},
    notes: parsed.notes ?? null,
  };
}
