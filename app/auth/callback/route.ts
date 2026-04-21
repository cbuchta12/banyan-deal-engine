import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=no_code`);
  }

  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !user) {
    return NextResponse.redirect(`${origin}/login?error=auth`);
  }

  // First login — provision org + profile
  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .single();

  if (!existing) {
    const base = user.email!.split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "");
    const slug = `${base}-${Math.random().toString(36).slice(2, 6)}`;

    const { data: org } = await supabase
      .from("organizations")
      .insert({ name: base, slug })
      .select()
      .single();

    if (org) {
      await supabase.from("profiles").insert({
        id: user.id,
        org_id: org.id,
        email: user.email!,
        role: "owner",
      });
    }
  }

  return NextResponse.redirect(`${origin}${next}`);
}
