import { getAuthContext } from "@/lib/auth";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_AUTH_ENABLED === "true") {
    await getAuthContext();
  }
  return <>{children}</>;
}
