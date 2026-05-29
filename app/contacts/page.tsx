import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import AppHeader from "@/components/AppHeader";
import type { Contact } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ContactsPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const supabase = createClient();
  const q = searchParams.q?.trim();

  let query = supabase
    .from("contacts")
    .select("id, full_name, title, company, email, card_image_front_url")
    .order("created_at", { ascending: false });

  if (q) {
    query = query.or(`full_name.ilike.%${q}%,company.ilike.%${q}%`);
  }

  const { data: contacts } = await query;

  return (
    <div>
      <AppHeader title="CRM 名片" />
      <main className="mx-auto max-w-2xl p-4">
        <form className="mb-4">
          <input
            name="q"
            defaultValue={q}
            placeholder="搜尋姓名或公司…"
            className="w-full rounded-lg border px-3 py-2"
          />
        </form>

        {!contacts || contacts.length === 0 ? (
          <div className="rounded-xl border border-dashed bg-white p-10 text-center text-gray-500">
            {q ? "找不到符合的聯絡人" : "還沒有聯絡人，點右上角「拍名片」開始建立。"}
          </div>
        ) : (
          <ul className="space-y-2">
            {(contacts as Partial<Contact>[]).map((c) => (
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
