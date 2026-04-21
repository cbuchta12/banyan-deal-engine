import { getAuthContext } from "@/lib/auth";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  await getAuthContext(); // redirects to /login if unauthenticated
  return <>{children}</>;
}
