import { Users } from "lucide-react";
import prisma from "@/lib/prisma";
import { verifySession } from "@/lib/auth/dal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateInviteButton } from "@/components/settings/CreateInviteButton";
import { PageContainer } from "@/components/shared/PageContainer";
import { PageHeader } from "@/components/shared/PageHeader";

export default async function HouseholdSettingsPage() {
  const session = await verifySession();
  const household = await prisma.household.findUnique({
    where: { id: session.householdId },
    include: { users: { select: { id: true, nome: true, email: true } } },
  });

  return (
    <PageContainer className="max-w-2xl">
      <PageHeader
        title="Household"
        description="Gerencie quem tem acesso aos gastos compartilhados."
        backHref="/"
        backLabel="← Voltar ao dashboard"
      />

      <Card>
        <CardHeader>
          <CardTitle>{household?.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="flex flex-col gap-3">
            {household?.users.map((u) => (
              <li key={u.id} className="flex items-center gap-3 text-sm">
                <span className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                  <Users className="size-4" aria-hidden />
                </span>
                <span>
                  {u.nome} <span className="text-muted-foreground">({u.email})</span>
                </span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Convidar alguem</CardTitle>
        </CardHeader>
        <CardContent>
          <CreateInviteButton />
        </CardContent>
      </Card>
    </PageContainer>
  );
}
