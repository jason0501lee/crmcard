import { createClient } from "@/lib/supabase/client";
import type { ExtractionResult, Phone, SocialLink } from "@/lib/types";

const BUCKET = "cards";

// 將 dataURL 上傳到 Storage，回傳公開 URL
async function uploadDataUrl(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  dataUrl: string,
): Promise<string> {
  const blob = await (await fetch(dataUrl)).blob();
  const path = `${userId}/${crypto.randomUUID()}.jpg`;
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, blob, { contentType: "image/jpeg", upsert: false });
  if (error) throw error;
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export interface ContactFormValues {
  full_name: string;
  title: string;
  company: string;
  email: string;
  website: string;
  address: string;
  notes: string;
  phones: Phone[];
  social_links: SocialLink[];
  tags: string[];
}

// 建立新聯絡人：上傳原圖 → 寫 contacts → 寫子表 → 處理標籤
export async function createContact(
  values: ContactFormValues,
  images: { front: string | null; back: string | null },
  raw: ExtractionResult | null,
) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("未登入");

  const front = images.front
    ? await uploadDataUrl(supabase, user.id, images.front)
    : null;
  const back = images.back
    ? await uploadDataUrl(supabase, user.id, images.back)
    : null;

  const { data: contact, error } = await supabase
    .from("contacts")
    .insert({
      owner_id: user.id,
      full_name: values.full_name,
      title: values.title || null,
      company: values.company || null,
      email: values.email || null,
      website: values.website || null,
      address: values.address || null,
      notes: values.notes || null,
      card_image_front_url: front,
      card_image_back_url: back,
      raw_extraction: raw,
    })
    .select("id")
    .single();
  if (error) throw error;

  await syncChildren(supabase, user.id, contact.id, values);
  return contact.id as string;
}

// 更新既有聯絡人主欄位與子表
export async function updateContact(id: string, values: ContactFormValues) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("未登入");

  const { error } = await supabase
    .from("contacts")
    .update({
      full_name: values.full_name,
      title: values.title || null,
      company: values.company || null,
      email: values.email || null,
      website: values.website || null,
      address: values.address || null,
      notes: values.notes || null,
    })
    .eq("id", id);
  if (error) throw error;

  // 子表採「全刪重建」策略（MVP 簡化）
  await supabase.from("phones").delete().eq("contact_id", id);
  await supabase.from("social_links").delete().eq("contact_id", id);
  await supabase.from("contact_tags").delete().eq("contact_id", id);
  await syncChildren(supabase, user.id, id, values);
}

async function syncChildren(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  contactId: string,
  values: ContactFormValues,
) {
  const phones = values.phones.filter((p) => p.number.trim());
  if (phones.length) {
    await supabase.from("phones").insert(
      phones.map((p) => ({
        contact_id: contactId,
        owner_id: userId,
        label: p.label,
        number: p.number.trim(),
      })),
    );
  }

  const socials = values.social_links.filter((s) => s.handle || s.url);
  if (socials.length) {
    await supabase.from("social_links").insert(
      socials.map((s) => ({
        contact_id: contactId,
        owner_id: userId,
        platform: s.platform,
        handle: s.handle,
        url: s.url,
      })),
    );
  }

  // 標籤：找出或建立後關聯
  for (const name of values.tags.map((t) => t.trim()).filter(Boolean)) {
    const { data: existing } = await supabase
      .from("tags")
      .select("id")
      .eq("owner_id", userId)
      .eq("name", name)
      .maybeSingle();

    let tagId = existing?.id;
    if (!tagId) {
      const { data: created } = await supabase
        .from("tags")
        .insert({ owner_id: userId, name })
        .select("id")
        .single();
      tagId = created?.id;
    }
    if (tagId) {
      await supabase
        .from("contact_tags")
        .insert({ contact_id: contactId, tag_id: tagId });
    }
  }
}
