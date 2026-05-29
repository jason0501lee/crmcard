-- CRM 名片系統 — Phase 1 資料表 Schema
-- 後端：Supabase (Postgres)
-- 權限模型：單人帳號 + Row Level Security（每人只能存取自己的資料）
--
-- 注意：此為設計草案，待需求確認後再實際套用到 Supabase。

-- ============================================================
-- 1. contacts：核心聯絡人表（每筆 = 一張名片）
-- ============================================================
create table if not exists public.contacts (
  id               uuid primary key default gen_random_uuid(),
  owner_id         uuid not null references auth.users(id) on delete cascade,

  -- 名片基本欄位
  full_name        text not null,              -- 姓名（必要）
  title            text,                        -- 職稱 / 頭銜
  company          text,                        -- 公司名稱
  company_logo_url text,                        -- 公司 Logo（Storage URL，可空）
  email            text,                        -- 主要 Email
  website          text,                        -- 公司網站
  address          text,                        -- 公司地址

  -- 名片影像（正面 + 背面，存 Supabase Storage）
  card_image_front_url text,
  card_image_back_url  text,

  -- AI 擷取原始輸出（保留以供稽核 / 重跑）
  raw_extraction   jsonb,

  -- CRM 關係管理欄位
  notes            text,                        -- 備註

  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists idx_contacts_owner on public.contacts(owner_id);
create index if not exists idx_contacts_name   on public.contacts(owner_id, full_name);

-- ============================================================
-- 2. phones：電話子表（一對多）
-- ============================================================
create table if not exists public.phones (
  id           uuid primary key default gen_random_uuid(),
  contact_id   uuid not null references public.contacts(id) on delete cascade,
  owner_id     uuid not null references auth.users(id) on delete cascade,
  label        text,                            -- 例：office / mobile / fax
  number       text not null,
  created_at   timestamptz not null default now()
);
create index if not exists idx_phones_contact on public.phones(contact_id);

-- ============================================================
-- 3. social_links：社群 / 即時通訊子表（一對多）
-- ============================================================
create table if not exists public.social_links (
  id           uuid primary key default gen_random_uuid(),
  contact_id   uuid not null references public.contacts(id) on delete cascade,
  owner_id     uuid not null references auth.users(id) on delete cascade,
  platform     text not null,                   -- line / instagram / linkedin / whatsapp / facebook / other
  handle       text,                            -- 帳號 / ID
  url          text,                            -- 連結（可由 handle 推導或直接掃到）
  created_at   timestamptz not null default now()
);
create index if not exists idx_social_contact on public.social_links(contact_id);

-- ============================================================
-- 4. tags + contact_tags：標籤（多對多）
-- ============================================================
create table if not exists public.tags (
  id           uuid primary key default gen_random_uuid(),
  owner_id     uuid not null references auth.users(id) on delete cascade,
  name         text not null,
  color        text,                            -- 可選：UI 顯示色
  created_at   timestamptz not null default now(),
  unique (owner_id, name)
);

create table if not exists public.contact_tags (
  contact_id   uuid not null references public.contacts(id) on delete cascade,
  tag_id       uuid not null references public.tags(id) on delete cascade,
  primary key (contact_id, tag_id)
);

-- ============================================================
-- 5. updated_at 自動更新 trigger
-- ============================================================
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end; $$;

drop trigger if exists trg_contacts_updated on public.contacts;
create trigger trg_contacts_updated
  before update on public.contacts
  for each row execute function public.set_updated_at();

-- ============================================================
-- 6. Row Level Security：每位使用者只能存取自己的資料
-- ============================================================
alter table public.contacts      enable row level security;
alter table public.phones        enable row level security;
alter table public.social_links  enable row level security;
alter table public.tags          enable row level security;
alter table public.contact_tags  enable row level security;

-- contacts
create policy "own contacts" on public.contacts
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- phones
create policy "own phones" on public.phones
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- social_links
create policy "own socials" on public.social_links
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- tags
create policy "own tags" on public.tags
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- contact_tags（透過 contact 的擁有權判斷）
create policy "own contact_tags" on public.contact_tags
  for all using (
    exists (select 1 from public.contacts c
            where c.id = contact_tags.contact_id and c.owner_id = auth.uid())
  ) with check (
    exists (select 1 from public.contacts c
            where c.id = contact_tags.contact_id and c.owner_id = auth.uid())
  );
