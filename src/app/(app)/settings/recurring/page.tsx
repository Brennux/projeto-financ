import prisma from "@/lib/prisma";
import { verifySession } from "@/lib/auth/dal";
import { materializarRecorrencias } from "@/lib/recorrencias/server";
import { Card, CardContent } from "@/components/ui/card";
import { PageContainer } from "@/components/shared/PageContainer";
import { PageHeader } from "@/components/shared/PageHeader";
import { RecorrenciasManager } from "@/components/recorrencias/RecorrenciasManager";

interface Props {
  /** novo=1: abre o formulario de novo recorrente (vindo da busca global). */
  searchParams: Promise<{ novo?: string }>;
}

export default async function RecurringSettingsPage({ searchParams }: Props) {
  const { novo } = await searchParams;
  const session = await verifySession();
  await materializarRecorrencias(session.householdId);

  const linhas = await prisma.recurringTransaction.findMany({
    where: { householdId: session.householdId },
    include: { user: { select: { nome: true } } },
    orderBy: [{ ativo: "desc" }, { diaDoMes: "asc" }, { descricao: "asc" }],
  });

  const recorrencias = linhas.map((r) => ({
    id: r.id,
    tipo: r.tipo,
    valor: Number(r.valor),
    categoria: r.categoria,
    descricao: r.descricao,
    diaDoMes: r.diaDoMes,
    proximaData: r.proximaData,
    ativo: r.ativo,
    autor: r.user?.nome ?? null,
  }));

  return (
    <PageContainer className="max-w-3xl">
      <PageHeader
        title="Lançamentos recorrentes"
        description="Aluguel, salário, assinaturas: cadastre uma vez e o app lança sozinho todo mês."
        backHref="/"
        backLabel="← Voltar ao dashboard"
      />

      <Card>
        <CardContent>
          <RecorrenciasManager recorrencias={recorrencias} abrirNovo={novo === "1"} />
        </CardContent>
      </Card>
    </PageContainer>
  );
}
