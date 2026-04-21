import { createServerClient } from "@supabase/ssr";
import { createAdminClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=no_code`);
  }

  // Build redirect response first so we can attach session cookies directly to it
  const redirectTo = NextResponse.redirect(`${origin}${next}`);
  const errorRedirect = NextResponse.redirect(`${origin}/login?error=auth`);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            redirectTo.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user }, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !user) return errorRedirect;

  // First login — provision org + profile via admin client (bypasses RLS)
  const admin = await createAdminClient();

  const { data: existing } = await admin
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .single();

  if (!existing) {
    const base = user.email!.split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "");
    const slug = `${base}-${Math.random().toString(36).slice(2, 6)}`;

    const { data: org } = await admin
      .from("organizations")
      .insert({ name: base, slug })
      .select()
      .single();

    if (org) {
      await admin.from("profiles").insert({
        id: user.id,
        org_id: org.id,
        email: user.email!,
        role: "owner",
      });
    }
  }

  return redirectTo;
}
