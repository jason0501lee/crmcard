import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// 刷新 Supabase session，並保護需要登入的路徑
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAuthRoute = request.nextUrl.pathname.startsWith("/login");
  // 未登入且非登入頁 → 導向登入
  if (!user && !isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }
  // 已登入卻在登入頁 → 導向聯絡人列表
  if (user && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/contacts";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  // 排除靜態資源與 API
  matcher: ["/((?!_next/static|_next/image|favicon.ico|manifest.json|icons|api).*)"],
};
