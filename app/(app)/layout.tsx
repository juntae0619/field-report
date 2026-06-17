import { requireProfile } from "@/lib/auth";
import { logout } from "@/app/(auth)/actions";
import { AppShell } from "@/components/app-shell";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireProfile();

  return (
    <AppShell profile={profile} logoutAction={logout}>
      {children}
    </AppShell>
  );
}
