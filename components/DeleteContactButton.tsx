"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function DeleteContactButton({ id }: { id: string }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [confirming, setConfirming] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    const supabase = createClient();
    // 子表（phones/social_links/contact_tags）由 FK ON DELETE CASCADE 一併刪除
    const { error } = await supabase.from("contacts").delete().eq("id", id);
    if (error) {
      alert("刪除失敗：" + error.message);
      setDeleting(false);
      return;
    }
    router.push("/contacts");
    router.refresh();
  }

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        className="block w-full rounded-lg border border-red-200 bg-white py-2 text-center font-medium text-red-600"
      >
        刪除
      </button>
    );
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={handleDelete}
        disabled={deleting}
        className="flex-1 rounded-lg bg-red-600 py-2 font-medium text-white disabled:opacity-50"
      >
        {deleting ? "刪除中…" : "確定刪除"}
      </button>
      <button
        onClick={() => setConfirming(false)}
        className="rounded-lg border px-4"
      >
        取消
      </button>
    </div>
  );
}
