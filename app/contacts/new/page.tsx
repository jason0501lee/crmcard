"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppHeader from "@/components/AppHeader";
import ContactForm from "@/components/ContactForm";
import type { ContactFormValues } from "@/lib/contacts";
import type { ExtractionResult } from "@/lib/types";

interface Draft {
  result: ExtractionResult;
  front: string | null;
  back: string | null;
}

const LOW_CONF = 0.6;

export default function NewContactPage() {
  const router = useRouter();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem("draftContact");
    if (raw) setDraft(JSON.parse(raw));
    setLoaded(true);
  }, []);

  if (loaded && !draft) {
    // 沒有草稿（例如重新整理）→ 回拍照頁
    router.replace("/capture");
    return null;
  }
  if (!draft) return null;

  const r = draft.result;
  const initial: ContactFormValues = {
    full_name: r.full_name ?? "",
    title: r.title ?? "",
    company: r.company ?? "",
    email: r.email ?? "",
    website: r.website ?? "",
    address: r.address ?? "",
    notes: "",
    phones: r.phones ?? [],
    social_links: r.social_links ?? [],
    tags: [],
  };

  const lowConfidence = Object.entries(r.confidence ?? {})
    .filter(([, score]) => typeof score === "number" && score < LOW_CONF)
    .map(([field]) => field);

  return (
    <div>
      <AppHeader title="確認名片資訊" />
      <main className="mx-auto max-w-2xl p-4">
        <ContactForm
          mode="new"
          initial={initial}
          images={{ front: draft.front, back: draft.back }}
          raw={r}
          lowConfidence={lowConfidence}
        />
      </main>
    </div>
  );
}
