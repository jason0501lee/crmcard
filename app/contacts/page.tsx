import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import AppHeader from "@/components/AppHeader";
import type { Contact } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ContactsPage({
  searchParams,
}: {
  searchParams: { q?: string; tag?: string };
}) {
  const supabase = createClient();
  const q = searchParams.q?.trim();
  const tag = searchParams.tag?.trim();

  // 使用者所有標籤（給篩選 chip）
  const { data: allTags } = await supabase
    .from("tags")
    .select("id, name")
    .order("name");

  // 依是否有標籤篩選，決定 select（用 !inner 過濾關聯）
  const columns = tag
    ? "id, full_name, title, company, email, card_image_front_url, contact_tags!inner(tags!inner(name))"
    : "id, full_name, title, company, email, card_image_front_url";

  let query = supabase
    .from("contacts")
    .select(columns)
    .order("created_at", { ascending: false });

  if (tag) query = query.eq("contact_tags.tags.name", tag);
  if (q) query = query.or(`full_name.ilike.%${q}%,company.ilike.%${q}%`);

  const { data: contacts } = await query;

  return (
    <div>
      <AppHeader title="CRM 名片" />
      <main className="mx-auto max-w-2xl p-4">
        <form className="mb-3">
          <input
            name="q"
            defaultValue={q}
            placeholder="搜尋姓名或公司…"
            className="w-full rounded-lg border px-3 py-2"
          />
          {tag && <input type="hidden" name="tag" value={tag} />}
        </form>

        {/* 標籤篩選 chips */}
        {allTags && allTags.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2">
            <Link
              href={q ? `/contacts?q=${encodeURIComponent(q)}` : "/contacts"}
              className={`rounded-full px-3 py-1 text-xs ${!tag ? "bg-brand text-white" : "bg-gray-100 text-gray-600"}`}
            >
              全部
            </Link>
            {allTags.map((t) => (
              <Link
                key={t.id}
                href={`/contacts?tag=${encodeURIComponent(t.name)}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
                className={`rounded-full px-3 py-1 text-xs ${tag === t.name ? "bg-brand text-white" : "bg-gray-100 text-gray-600"}`}
              >
                {t.name}
              </Link>
            ))}
          </div>
        )}

        {!contacts || contacts.length === 0 ? (
          <div className="rounded-xl border border-dashed bg-white p-10 text-center text-gray-500">
            {q || tag ? "找不到符合的聯絡人" : "還沒有聯絡人，點右上角「拍名片」開始建立。"}
          </div>
        ) : (
          <ul className="space-y-2">
            {(contacts as unknown as Partial<Contact>[]).map((c) => (
              <li key={c.id}>
                <Link
                  href={`/contacts/${c.id}`}
                  className="flex items-center gap-3 rounded-xl bg-white p-3 shadow-sm"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand/10 text-brand font-semibold">
                    {c.full_name?.[0] ?? "?"}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-medium">{c.full_name}</p>
                    <p className="truncate text-sm text-gray-500">
                      {[c.title, c.company].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
