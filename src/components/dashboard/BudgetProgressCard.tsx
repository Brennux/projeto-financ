import Link from "next/link";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/EmptyState";
import { BudgetProgressList } from "@/components/budgets/BudgetProgressList";
import type { OrcamentoComGasto } from "@/lib/queries/budgets";

interface Props {
  orcamentos: OrcamentoComGasto[];
}

export function BudgetProgressCard({ orcamentos }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Orçamentos do mês</CardTitle>
        <CardAction>
          <Link href="/settings/budgets" className={buttonVariants({ variant: "outline", size: "sm" })}>
            Gerenciar
          </Link>
        </CardAction>
      </CardHeader>
      <CardContent>
        {orcamentos.length === 0 ? (
          <EmptyState
            message="Nenhum orçamento definido ainda."
            action={
              <Link href="/settings/budgets" className="text-sm text-primary hover:underline">
                Definir um limite por categoria
              </Link>
            }
          />
        ) : (
          <BudgetProgressList orcamentos={orcamentos} />
        )}
      </CardContent>
    </Card>
  );
}
