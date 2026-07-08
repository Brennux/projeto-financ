import { verifySession } from "@/lib/auth/dal";
import prisma from "@/lib/prisma";
import { AppShell } from "@/components/layout/AppShell";

export default async function AppLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const session = await verifySession();
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { nome: true, household: { select: { name: true } } },
  });

  return (
    <AppShell userName={user?.nome ?? "Você"} householdName={user?.household.name ?? "Gastos"}>
      {children}
    </AppShell>
  );
}
