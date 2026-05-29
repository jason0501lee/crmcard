// 共用型別 — 對齊 supabase/schema.sql 與 AI 擷取契約

export type PhoneLabel = "office" | "mobile" | "fax" | "other";
export type SocialPlatform =
  | "line"
  | "instagram"
  | "linkedin"
  | "whatsapp"
  | "facebook"
  | "other";

export interface Phone {
  id?: string;
  label: PhoneLabel;
  number: string;
}

export interface SocialLink {
  id?: string;
  platform: SocialPlatform;
  handle: string | null;
  url: string | null;
}

export interface Tag {
  id: string;
  name: string;
  color: string | null;
}

// AI 擷取契約回傳結構（見 docs/extraction-contract.md）
export interface ExtractionResult {
  full_name: string | null;
  title: string | null;
  company: string | null;
  email: string | null;
  website: string | null;
  address: string | null;
  phones: Phone[];
  social_links: SocialLink[];
  confidence: Partial<Record<"full_name" | "company" | "email" | "phones", number>>;
  notes: string | null;
}

// 資料庫聯絡人（含子表）
export interface Contact {
  id: string;
  owner_id: string;
  full_name: string;
  title: string | null;
  company: string | null;
  company_logo_url: string | null;
  email: string | null;
  website: string | null;
  address: string | null;
  card_image_front_url: string | null;
  card_image_back_url: string | null;
  raw_extraction: ExtractionResult | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  phones?: Phone[];
  social_links?: SocialLink[];
  tags?: Tag[];
}
