"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type {
  ContactFormValues,
} from "@/lib/contacts";
import { createContact, updateContact } from "@/lib/contacts";
import type { ExtractionResult, PhoneLabel, SocialPlatform } from "@/lib/types";

const PHONE_LABELS: PhoneLabel[] = ["office", "mobile", "fax", "other"];
const SOCIAL_PLATFORMS: SocialPlatform[] = [
  "line",
  "instagram",
  "linkedin",
  "whatsapp",
  "facebook",
  "other",
];

interface Props {
  mode: "new" | "edit";
  initial: ContactFormValues;
  // new 模式才需要：原圖與 AI 原始輸出
  images?: { front: string | null; back: string | null };
  raw?: ExtractionResult | null;
  contactId?: string; // edit 模式
  // 低信心欄位（new 模式高亮提示）
  lowConfidence?: string[];
}

export default function ContactForm({
  mode,
  initial,
  images,
  raw,
  contactId,
  lowConfidence = [],
}: Props) {
  const router = useRouter();
  const [v, setV] = useState<ContactFormValues>(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof ContactFormValues>(k: K, val: ContactFormValues[K]) {
    setV((prev) => ({ ...prev, [k]: val }));
  }

  const flag = (field: string) =>
    lowConfidence.includes(field) ? "ring-2 ring-amber-400" : "";

  async function handleSave() {
    if (!v.full_name.trim()) {
      setError("姓名為必填");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      if (mode === "new") {
        const id = await createContact(v, images ?? { front: null, back: null }, raw ?? null);
        sessionStorage.removeItem("draftContact");
        router.replace(`/contacts/${id}`);
      } else if (contactId) {
        await updateContact(contactId, v);
        router.replace(`/contacts/${contactId}`);
      }
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "儲存失敗");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      {images?.front && (
        <div className="grid grid-cols-2 gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={images.front} alt="正面" className="rounded-lg border" />
          {images.back && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={images.back} alt="背面" className="rounded-lg border" />
          )}
        </div>
      )}

      {lowConfidence.length > 0 && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">
          ⚠️ 已標示的欄位 AI 信心較低，請特別檢查。
        </p>
      )}

      <Field label="姓名 *" className={flag("full_name")}>
        <input
          className="input"
          value={v.full_name}
          onChange={(e) => set("full_name", e.target.value)}
        />
      </Field>
      <Field label="職稱">
        <input className="input" value={v.title} onChange={(e) => set("title", e.target.value)} />
      </Field>
      <Field label="公司" className={flag("company")}>
        <input className="input" value={v.company} onChange={(e) => set("company", e.target.value)} />
      </Field>
      <Field label="Email" className={flag("email")}>
        <input className="input" value={v.email} onChange={(e) => set("email", e.target.value)} />
      </Field>
      <Field label="網站">
        <input className="input" value={v.website} onChange={(e) => set("website", e.target.value)} />
      </Field>
      <Field label="地址">
        <input className="input" value={v.address} onChange={(e) => set("address", e.target.value)} />
      </Field>

      {/* 電話（多筆） */}
      <div>
        <p className="mb-1 text-sm font-medium text-gray-600">電話</p>
        {v.phones.map((p, i) => (
          <div key={i} className="mb-2 flex gap-2">
            <select
              className="input w-28"
              value={p.label}
              onChange={(e) => {
                const next = [...v.phones];
                next[i] = { ...p, label: e.target.value as PhoneLabel };
                set("phones", next);
              }}
            >
              {PHONE_LABELS.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
            <input
              className="input flex-1"
              value={p.number}
              onChange={(e) => {
                const next = [...v.phones];
                next[i] = { ...p, number: e.target.value };
                set("phones", next);
              }}
            />
            <button className="text-sm text-red-500" onClick={() => set("phones", v.phones.filter((_, j) => j !== i))}>
              刪
            </button>
          </div>
        ))}
        <button
          className="text-sm text-brand"
          onClick={() => set("phones", [...v.phones, { label: "mobile", number: "" }])}
        >
          + 新增電話
        </button>
      </div>

      {/* 社群（多筆） */}
      <div>
        <p className="mb-1 text-sm font-medium text-gray-600">社群 / 即時通訊</p>
        {v.social_links.map((s, i) => (
          <div key={i} className="mb-2 flex gap-2">
            <select
              className="input w-28"
              value={s.platform}
              onChange={(e) => {
                const next = [...v.social_links];
                next[i] = { ...s, platform: e.target.value as SocialPlatform };
                set("social_links", next);
              }}
            >
              {SOCIAL_PLATFORMS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
            <input
              className="input flex-1"
              placeholder="帳號 / ID 或連結"
              value={s.handle ?? s.url ?? ""}
              onChange={(e) => {
                const next = [...v.social_links];
                next[i] = { ...s, handle: e.target.value, url: s.url };
                set("social_links", next);
              }}
            />
            <button className="text-sm text-red-500" onClick={() => set("social_links", v.social_links.filter((_, j) => j !== i))}>
              刪
            </button>
          </div>
        ))}
        <button
          className="text-sm text-brand"
          onClick={() =>
            set("social_links", [...v.social_links, { platform: "line", handle: "", url: null }])
          }
        >
          + 新增社群
        </button>
      </div>

      {/* 標籤 */}
      <Field label="標籤（以逗號分隔）">
        <input
          className="input"
          value={v.tags.join(", ")}
          onChange={(e) => set("tags", e.target.value.split(",").map((t) => t.trim()))}
        />
      </Field>

      {/* 備註 */}
      <Field label="備註">
        <textarea
          className="input min-h-[80px]"
          value={v.notes}
          onChange={(e) => set("notes", e.target.value)}
        />
      </Field>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 rounded-lg bg-brand py-3 font-medium text-white disabled:opacity-50"
        >
          {saving ? "儲存中…" : mode === "new" ? "確認並儲存" : "更新"}
        </button>
        <button onClick={() => router.back()} className="rounded-lg border px-4">
          取消
        </button>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-gray-600">{label}</span>
      <div className={`rounded-lg ${className}`}>{children}</div>
    </label>
  );
}
