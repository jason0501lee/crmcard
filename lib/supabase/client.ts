"use client";

import { createBrowserClient } from "@supabase/ssr";

// 瀏覽器端 Supabase client（用於 client component）
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
