import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppHeader from "@/components/AppHeader";
import ContactForm from "@/components/ContactForm";
import type { ContactFormValues } from "@/lib/contacts";
import type { Contact } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function EditContactPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const { data } = await supabase
    .from("contacts")
    .select("*, phones(*), social_links(*), contact_tags(tags(name))")
    .eq("id", params.id)
    .single();

  if (!data) notFound();

  const contact = data as unknown as Contact & {
    contact_tags: { tags: { name: string } }[];
  };

  const initial: ContactFormValues = {
    full_name: contact.full_name ?? "",
    title: contact.title ?? "",
    company: contact.company ?? "",
    email: contact.email ?? "",
    website: contact.website ?? "",
    address: contact.address ?? "",
    notes: contact.notes ?? "",
    phones: (contact.phones ?? []).map((p) => ({ label: p.label, number: p.number })),
    social_links: (contact.social_links ?? []).map((s) => ({
      platform: s.platform,
      handle: s.handle,
      url: s.url,
    })),
    tags: contact.contact_tags?.map((ct) => ct.tags.name) ?? [],
  };

  return (
    <div>
      <AppHeader title="編輯聯絡人" />
      <main className="mx-auto max-w-2xl p-4">
        <ContactForm mode="edit" initial={initial} contactId={params.id} />
      </main>
    </div>
  );
}
