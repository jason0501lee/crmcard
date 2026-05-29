"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AppHeader({ title }: { title: string }) {
  const router = useRouter();
  const supabase = createClient();

  async function logout() {
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-4 py-3">
      <Link href="/contacts" className="text-lg font-bold">
        {title}
      </Link>
      <div className="flex items-center gap-3">
        <Link
          href="/capture"
          className="rounded-lg bg-brand px-3 py-1.5 text-sm font-medium text-white"
        >
          + 拍名片
        </Link>
        <button onClick={logout} className="text-sm text-gray-500">
          登出
        </button>
      </div>
    </header>
  );
}
