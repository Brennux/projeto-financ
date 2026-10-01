import { verifySession } from "@/lib/auth/dal";
import prisma from "@/lib/prisma";
import { AppShell } from "@/components/layout/AppShell";

export default async function AppLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const session = await verifySession();
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { nome: true, email: true, household: { select: { name: true } } },
  });

  return (
    <AppShell
      userName={user?.nome ?? "Você"}
      userEmail={user?.email ?? ""}
      householdName={user?.household.name ?? "FINAC Pro"}
    >
      {children}
    </AppShell>
  );
}
