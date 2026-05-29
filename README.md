# CRM 名片系統

拍名片 → AI（Claude Vision）擷取 → 人工確認 → 存進個人 CRM。Next.js PWA + Supabase。

> 設計文件見 `docs/PRD.md`、資料模型見 `supabase/schema.sql`、擷取契約見 `docs/extraction-contract.md`。

## 技術棧
- **前端 / PWA**：Next.js 14 (App Router) + TypeScript + Tailwind
- **後端**：Supabase（Auth + Postgres + Storage，RLS 單人隔離）
- **AI 擷取**：Claude Vision（`lib/extractor` 為可抽換介面，未來可換 Gemini）

## 快速開始

1. 安裝相依套件
   ```bash
   npm install
   ```

2. 設定環境變數：複製 `.env.example` 為 `.env.local` 並填入
   - `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `ANTHROPIC_API_KEY`

3. 在 Supabase SQL editor 執行
   - `supabase/schema.sql`（資料表 + RLS）
   - `supabase/storage.sql`（名片影像 bucket）

4. 啟動
   ```bash
   npm run dev
   ```

## 主流程
```
登入 → /capture 拍正面(+背面) → AI 擷取 → /contacts/new 確認/修正 → 存檔
     → /contacts 列表/搜尋 → /contacts/[id] 詳情 → /edit 編輯
```

## 主要檔案
| 路徑 | 說明 |
|---|---|
| `app/login` | 登入 / 註冊 |
| `app/capture` | 拍照、壓縮、呼叫擷取 API |
| `app/api/extract/route.ts` | 伺服器端擷取端點 |
| `lib/extractor/` | 可抽換的擷取介面與 Claude 實作 |
| `app/contacts/new` | 擷取結果確認頁（低信心欄位高亮） |
| `app/contacts/[id]` | 聯絡人詳情 / 編輯 |
| `lib/contacts.ts` | 建立 / 更新聯絡人（含影像上傳、子表同步） |

## 待辦（Phase 2 之後）
建立自己的數位名片、QR Code、團隊共享、批次掃描、vCard/CSV 匯出、重複偵測。
備註：`public/icons/` 需放 192/512 PNG 圖示供 PWA 安裝使用。
