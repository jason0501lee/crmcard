import type { ExtractionResult } from "@/lib/types";
import { ClaudeExtractor } from "./claude";

// 可抽換的擷取介面：日後要換 Gemini 只要新增一個實作並在 factory 註冊
export interface CardExtractor {
  extract(input: {
    frontImageBase64: string;
    frontMediaType: string;
    backImageBase64?: string;
    backMediaType?: string;
  }): Promise<ExtractionResult>;
}

export function getExtractor(): CardExtractor {
  const which = process.env.CARD_EXTRACTOR ?? "claude";
  switch (which) {
    case "claude":
      return new ClaudeExtractor();
    // case "gemini": return new GeminiExtractor();
    default:
      return new ClaudeExtractor();
  }
}
