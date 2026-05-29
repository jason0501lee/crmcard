"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AppHeader from "@/components/AppHeader";

// 將檔案讀成壓縮後的 dataURL（限制長邊，降低上傳與 API 成本）
function fileToDataUrl(file: File, maxEdge = 1600): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();
    reader.onload = () => {
      img.onload = () => {
        const scale = Math.min(1, maxEdge / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.onerror = reject;
      img.src = reader.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function ImageSlot({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string | null;
  onChange: (v: string | null) => void;
}) {
  return (
    <label className="flex aspect-[1.6] cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed bg-white">
      {value ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={value} alt={label} className="h-full w-full object-cover" />
      ) : (
        <span className="text-sm text-gray-500">{label}</span>
      )}
      <input
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={async (e) => {
          const f = e.target.files?.[0];
          if (f) onChange(await fileToDataUrl(f));
        }}
      />
    </label>
  );
}

export default function CapturePage() {
  const router = useRouter();
  const [front, setFront] = useState<string | null>(null);
  const [back, setBack] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleExtract() {
    if (!front) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ front, back }),
      });
      if (!res.ok) throw new Error("擷取失敗，請重試或手動輸入");
      const result = await res.json();
      // 暫存擷取結果與原圖，帶到確認頁
      sessionStorage.setItem(
        "draftContact",
        JSON.stringify({ result, front, back }),
      );
      router.push("/contacts/new");
    } catch (e) {
      setError(e instanceof Error ? e.message : "發生錯誤");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <AppHeader title="拍名片" />
      <main className="mx-auto max-w-2xl space-y-4 p-4">
        <p className="text-sm text-gray-500">
          拍攝或選擇名片照片。背面可留空（背面常為英文版或社群資訊）。
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <ImageSlot label="正面（必要）" value={front} onChange={setFront} />
          <ImageSlot label="背面（可選）" value={back} onChange={setBack} />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          onClick={handleExtract}
          disabled={!front || loading}
          className="w-full rounded-lg bg-brand py-3 font-medium text-white disabled:opacity-50"
        >
          {loading ? "AI 擷取中…" : "AI 擷取並確認"}
        </button>
      </main>
    </div>
  );
}
