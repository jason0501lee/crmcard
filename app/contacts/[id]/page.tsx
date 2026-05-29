import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppHeader from "@/components/AppHeader";
import type { Contact } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ContactDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const { data } = await supabase
    .from("contacts")
    .select(
      "*, phones(*), social_links(*), contact_tags(tags(id,name,color))",
    )
    .eq("id", params.id)
    .single();

  if (!data) notFound();

  const contact = data as unknown as Contact & {
    contact_tags: { tags: { id: string; name: string; color: string | null } }[];
  };
  const tags = contact.contact_tags?.map((ct) => ct.tags) ?? [];

  return (
    <div>
      <AppHeader title="聯絡人" />
      <main className="mx-auto max-w-2xl space-y-4 p-4">
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <h1 className="text-2xl font-bold">{contact.full_name}</h1>
          <p className="text-gray-500">
            {[contact.title, contact.company].filter(Boolean).join(" · ")}
          </p>

          <dl className="mt-4 space-y-2 text-sm">
            {contact.email && <Row label="Email" value={contact.email} />}
            {contact.website && <Row label="網站" value={contact.website} />}
            {contact.address && <Row label="地址" value={contact.address} />}
            {contact.phones?.map((p) => (
              <Row key={p.id} label={`電話 (${p.label})`} value={p.number} />
            ))}
            {contact.social_links?.map((s) => (
              <Row key={s.id} label={s.platform} value={s.handle ?? s.url ?? ""} />
            ))}
          </dl>

          {tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {tags.map((t) => (
                <span key={t.id} className="rounded-full bg-brand/10 px-3 py-1 text-xs text-brand">
                  {t.name}
                </span>
              ))}
            </div>
          )}

          {contact.notes && (
            <div className="mt-4 rounded-lg bg-gray-50 p-3 text-sm">
              <p className="mb-1 font-medium text-gray-500">備註</p>
              <p className="whitespace-pre-wrap">{contact.notes}</p>
            </div>
          )}
        </div>

        {(contact.card_image_front_url || contact.card_image_back_url) && (
          <div className="grid grid-cols-2 gap-2">
            {contact.card_image_front_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={contact.card_image_front_url} alt="名片正面" className="rounded-lg border" />
            )}
            {contact.card_image_back_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={contact.card_image_back_url} alt="名片背面" className="rounded-lg border" />
            )}
          </div>
        )}

        <Link
          href={`/contacts/${contact.id}/edit`}
          className="block rounded-lg border bg-white py-2 text-center font-medium"
        >
          編輯
        </Link>
      </main>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <dt className="w-24 shrink-0 text-gray-500">{label}</dt>
      <dd className="break-all">{value}</dd>
    </div>
  );
}
