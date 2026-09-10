/**
 * app/auth/callback/route.ts
 *
 * Handles the redirect after Supabase email confirmation.
 * Sets the session from the code in the URL, then:
 *   - Calls create_org_and_profile if pending_profile is in localStorage (handled client-side)
 *   - Redirects to /dashboard
 */
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: (cookiesToSet) => {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Redirect to the onboarding finisher page which completes profile setup
      return NextResponse.redirect(`${origin}/auth/setup`);
    }
  }

  // Auth failed — send back to login with error
  return NextResponse.redirect(`${origin}/login?error=confirmation_failed`);
}
