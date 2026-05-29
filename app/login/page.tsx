"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);

    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) setMsg(error.message);
      else setMsg("註冊成功！若需 email 驗證請查收信箱，或直接登入。");
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setMsg(error.message);
      else {
        router.replace("/contacts");
        router.refresh();
      }
    }
    setLoading(false);
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow">
        <h1 className="mb-1 text-2xl font-bold">CRM 名片</h1>
        <p className="mb-6 text-sm text-gray-500">
          {mode === "signin" ? "登入以管理你的名片聯絡人" : "建立帳號"}
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="email"
            required
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border px-3 py-2"
          />
          <input
            type="password"
            required
            minLength={6}
            placeholder="密碼（至少 6 碼）"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border px-3 py-2"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-brand py-2 font-medium text-white disabled:opacity-50"
          >
            {loading ? "處理中…" : mode === "signin" ? "登入" : "註冊"}
          </button>
        </form>

        {msg && <p className="mt-3 text-sm text-red-600">{msg}</p>}

        <button
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="mt-4 w-full text-sm text-brand"
        >
          {mode === "signin" ? "還沒有帳號？註冊" : "已有帳號？登入"}
        </button>
      </div>
    </main>
  );
}
