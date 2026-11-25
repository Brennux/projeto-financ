import { verifySession } from "@/lib/auth/dal";
import prisma from "@/lib/prisma";
import { getCategorias } from "@/lib/categorias/server";
import { getCartoes } from "@/lib/cartoes/server";
import { AppShell } from "@/components/layout/AppShell";
import { CategoriasProvider } from "@/components/categorias/CategoriasProvider";
import { CartoesProvider } from "@/components/cartoes/CartoesProvider";

export default async function AppLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const session = await verifySession();
  const [user, categorias, cartoes] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.userId },
      select: { nome: true, email: true, household: { select: { name: true } } },
    }),
    getCategorias(session.householdId),
    getCartoes(session.householdId),
  ]);

  return (
    <CategoriasProvider categorias={categorias}>
      <CartoesProvider cartoes={cartoes}>
        <AppShell
          userName={user?.nome ?? "Você"}
          userEmail={user?.email ?? ""}
          householdName={user?.household.name ?? "FINAC Pro"}
        >
          {children}
        </AppShell>
      </CartoesProvider>
    </CategoriasProvider>
  );
}
