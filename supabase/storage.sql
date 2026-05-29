-- Supabase Storage：名片影像 bucket + 權限
-- 在 SQL editor 執行；或於 Dashboard 手動建立 bucket "cards"（public 讀）。

insert into storage.buckets (id, name, public)
values ('cards', 'cards', true)
on conflict (id) do nothing;

-- 僅允許使用者上傳到自己的資料夾（路徑前綴為其 user id）
create policy "users upload own cards"
  on storage.objects for insert
  with check (
    bucket_id = 'cards'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "users manage own cards"
  on storage.objects for update using (
    bucket_id = 'cards' and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "users delete own cards"
  on storage.objects for delete using (
    bucket_id = 'cards' and (storage.foldername(name))[1] = auth.uid()::text
  );

-- public 讀（名片影像可公開讀；若需私密改用 signed URL）
create policy "public read cards"
  on storage.objects for select using (bucket_id = 'cards');
