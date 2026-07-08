import Link from "next/link";
import { BalanceSummaryCards } from "@/components/dashboard/BalanceSummaryCards";
import { BudgetGaugeCard } from "@/components/dashboard/BudgetGaugeCard";
import { BudgetProgressCard } from "@/components/dashboard/BudgetProgressCard";
import { CategoryBreakdownChart } from "@/components/dashboard/CategoryBreakdownChart";
import { MonthlyTrendChart } from "@/components/dashboard/MonthlyTrendChart";
import { PeriodPicker } from "@/components/dashboard/PeriodPicker";
import { TransactionList } from "@/components/dashboard/TransactionList";
import { PageContainer } from "@/components/shared/PageContainer";
import { PageHeader } from "@/components/shared/PageHeader";
import { buttonVariants } from "@/components/ui/button";
import { verifySession } from "@/lib/auth/dal";
import { getOrcamentosComGasto } from "@/lib/queries/budgets";
import {
  getDespesasPorCategoria,
  getResumoMensal,
  getTendenciaMensal,
  getTransacoesRecentes,
} from "@/lib/queries/transactions";

function resolverReferenceDate(mes?: string): Date {
  if (!mes) return new Date();
  const data = new Date(`${mes}-01T00:00:00`);
  return Number.isNaN(data.getTime()) ? new Date() : data;
}

interface Props {
  searchParams: Promise<{ mes?: string }>;
}

export default async function DashboardPage({ searchParams }: Props) {
  const { mes } = await searchParams;
  const referenceDate = resolverReferenceDate(mes);
  const session = await verifySession();

  const [resumo, categorias, tendencia, recentes, orcamentos] = await Promise.all([
    getResumoMensal(session.householdId, referenceDate),
    getDespesasPorCategoria(session.householdId, referenceDate),
    getTendenciaMensal(session.householdId, referenceDate),
    getTransacoesRecentes(session.householdId, 8, referenceDate),
    getOrcamentosComGasto(session.householdId, referenceDate),
  ]);

  return (
    <PageContainer>
      <PageHeader
        title="Dashboard"
        description="Registrado automaticamente via WhatsApp, ou adicione manualmente."
        actions={
          <Link href="/transactions" className={buttonVariants({ variant: "outline", size: "sm" })}>
            Ver todas as transações
          </Link>
        }
      />

      <PeriodPicker referenceDate={referenceDate} />

      <BalanceSummaryCards {...resumo} />

      <div className="grid items-stretch gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <MonthlyTrendChart data={tendencia} />
        </div>
        <BudgetGaugeCard orcamentos={orcamentos} />
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <CategoryBreakdownChart data={categorias} />
        <BudgetProgressCard orcamentos={orcamentos} />
      </div>

      <TransactionList transactions={recentes} />
    </PageContainer>
  );
}
