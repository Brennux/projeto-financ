import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageContainer } from "@/components/shared/PageContainer";
import { PageHeader } from "@/components/shared/PageHeader";
import { TransactionFormDialog } from "@/components/transactions/TransactionFormDialog";
import { TransactionsTable } from "@/components/transactions/TransactionsTable";
import { verifySession } from "@/lib/auth/dal";
import { getTransacoesRecentes } from "@/lib/queries/transactions";

interface Props {
  searchParams: Promise<{ q?: string }>;
}

export default async function TransactionsPage({ searchParams }: Props) {
  const { q } = await searchParams;
  const session = await verifySession();
  const transacoes = await getTransacoesRecentes(session.householdId, 500, undefined, q);

  return (
    <PageContainer>
      <PageHeader
        title="Transações"
        backHref="/"
        backLabel="← Voltar ao dashboard"
        description={
          q ? (
            <>
              Resultados para <span className="font-medium text-foreground">&quot;{q}&quot;</span> ·{" "}
              <Link href="/transactions" className="hover:underline">
                limpar busca
              </Link>
            </>
          ) : undefined
        }
        actions={
          <TransactionFormDialog
            trigger={
              <Button>
                <Plus className="size-4" />
                Nova transação
              </Button>
            }
          />
        }
      />

      <Card>
        <CardContent>
          <TransactionsTable transacoes={transacoes} />
        </CardContent>
      </Card>
    </PageContainer>
  );
}
