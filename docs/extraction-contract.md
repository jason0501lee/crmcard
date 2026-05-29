# AI 名片擷取契約 (Extraction Contract)

> Phase 1：以 Claude Vision 將名片照片（正面 + 背面）擷取為結構化 JSON。
> 此契約定義「模型必須回傳的格式」，前端確認頁與資料庫寫入皆依此對接。
> 擷取層包成可抽換介面（`CardExtractor`），日後可替換模型（如 Gemini）。

## 輸入
- `front_image`：名片正面（必要）
- `back_image`：名片背面（可選）

## 輸出 JSON Schema
```jsonc
{
  "full_name":   "string | null",      // 姓名
  "title":       "string | null",      // 職稱 / 頭銜
  "company":     "string | null",      // 公司名稱
  "email":       "string | null",      // 主要 Email
  "website":     "string | null",      // 公司網站
  "address":     "string | null",      // 公司地址
  "phones": [                          // 多支電話
    { "label": "office|mobile|fax|other", "number": "string" }
  ],
  "social_links": [                    // 多個社群 / 即時通訊
    { "platform": "line|instagram|linkedin|whatsapp|facebook|other",
      "handle": "string | null",
      "url": "string | null" }
  ],
  "confidence": {                      // 0~1，標示各核心欄位信心，供確認頁提示
    "full_name": 0.0, "company": 0.0, "email": 0.0, "phones": 0.0
  },
  "notes": "string | null"             // 模型擷取時的補充（非使用者備註）
}
```

## 擷取規則（給模型的指示要點）
1. 僅輸出 JSON，缺漏欄位填 `null`，不要臆造資訊。
2. 中英混排：姓名以名片視覺主體判定；公司用正式登記名/品牌名。
3. 電話一律保留原始格式並標 label（公司電話 office、手機 mobile）。
4. Email 與網站需符合基本格式，否則填 null 並降低 confidence。
5. 同時參考正面與背面（背面常為英文版或 QR/社群）。
6. confidence 偏低的核心欄位，前端確認頁需高亮提示使用者檢查。

## 為何一定要有「人工確認頁」
LLM 擷取非 100% 正確，存檔前讓使用者比對原圖、修正欄位，是準確率與信任的關鍵防線。
