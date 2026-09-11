import { type NextRequest, NextResponse } from "next/server";

// MOCK MODE: Auth gate bypassed — set NEXT_PUBLIC_SUPABASE_URL in .env.local to enable real auth.
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isAuthPage = pathname.startsWith("/login") || pathname.startsWith("/register");
  const isLanding = pathname === "/";
  const isPublicAsset = /\.(svg|png|jpg|jpeg|gif|webp|ico)$/.test(pathname);

  if (isPublicAsset) return NextResponse.next();

  // Check mock-auth cookie set by the login page
  const isLoggedIn = request.cookies.get("promogest_mock_auth")?.value === "1";

  const supabaseConfigured =
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("your-project");

  // If Supabase is configured, delegate to real auth middleware
  if (supabaseConfigured) {
    const { updateSession } = await import("@/lib/supabase/middleware");
    return updateSession(request);
  }

  // Mock mode: gate on cookie (landing page stays public)
  if (!isLoggedIn && !isAuthPage && !isLanding) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (isLoggedIn && isAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
