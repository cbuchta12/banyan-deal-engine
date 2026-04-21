import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export interface AuthContext {
  user: { id: string; email: string };
  profile: { id: string; org_id: string; full_name: string | null; role: string };
  org: { id: string; name: string; slug: string };
}

export async function getAuthContext(): Promise<AuthContext> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, org_id, full_name, role, organizations(id, name, slug)")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/login");

  const org = (profile as any).organizations as { id: string; name: string; slug: string };

  return {
    user: { id: user.id, email: user.email! },
    profile: { id: profile.id, org_id: profile.org_id, full_name: profile.full_name, role: profile.role },
    org,
  };
}
