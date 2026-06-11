import { createClient } from "@/lib/supabase/server";
import type { Contact } from "@/lib/types";

export const dynamic = "force-dynamic";

const PHONE_TYPE: Record<string, string> = {
  office: "WORK,VOICE",
  mobile: "CELL",
  fax: "WORK,FAX",
  other: "VOICE",
};

// 跳脫 vCard 特殊字元
function esc(v: string): string {
  return v.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
}

// GET /api/contacts/[id]/vcard — 回傳 .vcf，行動裝置會跳「加入通訊錄」
export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("unauthorized", { status: 401 });

  const { data } = await supabase
    .from("contacts")
    .select("*, phones(*), social_links(*)")
    .eq("id", params.id)
    .single();

  if (!data) return new Response("not found", { status: 404 });
  const c = data as unknown as Contact;

  const lines: string[] = ["BEGIN:VCARD", "VERSION:3.0"];
  lines.push(`N:${esc(c.full_name)};;;;`);
  lines.push(`FN:${esc(c.full_name)}`);
  if (c.company) lines.push(`ORG:${esc(c.company)}`);
  if (c.title) lines.push(`TITLE:${esc(c.title)}`);
  if (c.email) lines.push(`EMAIL;TYPE=WORK:${esc(c.email)}`);
  for (const p of c.phones ?? []) {
    lines.push(`TEL;TYPE=${PHONE_TYPE[p.label] ?? "VOICE"}:${esc(p.number)}`);
  }
  if (c.website) lines.push(`URL:${esc(c.website)}`);
  if (c.address) lines.push(`ADR;TYPE=WORK:;;${esc(c.address)};;;;`);
  for (const s of c.social_links ?? []) {
    const val = s.url ?? s.handle;
    if (val) lines.push(`X-SOCIALPROFILE;TYPE=${s.platform}:${esc(val)}`);
  }
  if (c.notes) lines.push(`NOTE:${esc(c.notes)}`);
  lines.push("END:VCARD");

  const vcf = lines.join("\r\n");
  const filename = encodeURIComponent(`${c.full_name || "contact"}.vcf`);

  return new Response(vcf, {
    headers: {
      "Content-Type": "text/vcard; charset=utf-8",
      "Content-Disposition": `attachment; filename*=UTF-8''${filename}`,
    },
  });
}
