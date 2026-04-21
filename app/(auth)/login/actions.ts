"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function sendMagicLink(formData: FormData) {
  const email = (formData.get("email") as string | null)?.trim();
  if (!email) redirect("/login?error=email");

  const supabase = await createClient();

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://banyan-deal-engine.vercel.app";

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${appUrl}/auth/callback` },
  });

  if (error) redirect("/login?error=send");
  redirect("/login?sent=1");
}
