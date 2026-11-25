import { verifySession } from "@/lib/auth/dal";
import { getOrcamentosComGasto } from "@/lib/queries/budgets";
import { getCategorias } from "@/lib/categorias/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageContainer } from "@/components/shared/PageContainer";
import { PageHeader } from "@/components/shared/PageHeader";
import { BudgetsManager } from "@/components/budgets/BudgetsManager";

export default async function BudgetsSettingsPage() {
  const session = await verifySession();
  const [orcamentos, categorias] = await Promise.all([
    getOrcamentosComGasto(session.householdId),
    getCategorias(session.householdId),
  ]);
  // Orcamento so pra categoria que aceita despesa (Salario, por ex., nao entra).
  const categoriasSemOrcamento = categorias
    .filter((c) => c.tipos.includes("despesa") && !orcamentos.some((o) => o.categoria === c.nome))
    .map((c) => c.nome);

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
