import { verifySession } from "@/lib/auth/dal";
import { getOrcamentosComGasto } from "@/lib/queries/budgets";
import { CATEGORIAS_ORCAVEIS } from "@/lib/validation/budget";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageContainer } from "@/components/shared/PageContainer";
import { PageHeader } from "@/components/shared/PageHeader";
import { BudgetsManager } from "@/components/budgets/BudgetsManager";

export default async function BudgetsSettingsPage() {
  const session = await verifySession();
  const orcamentos = await getOrcamentosComGasto(session.householdId);
  const categoriasSemOrcamento = CATEGORIAS_ORCAVEIS.filter(
    (categoria) => !orcamentos.some((o) => o.categoria === categoria),
  );

  return (
    <PageContainer className="max-w-2xl">
      <PageHeader
        title="Orçamentos"
        description="Defina um limite mensal de gasto por categoria e acompanhe o progresso."
        backHref="/"
        backLabel="← Voltar ao dashboard"
      />

      <Card>
        <CardHeader>
          <CardTitle>Limites mensais</CardTitle>
        </CardHeader>
        <CardContent>
          <BudgetsManager orcamentos={orcamentos} categoriasSemOrcamento={categoriasSemOrcamento} />
        </CardContent>
      </Card>
    </PageContainer>
  );
}
