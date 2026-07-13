import Link from "next/link";
import { BalanceSummaryCards } from "@/components/dashboard/BalanceSummaryCards";
import { BudgetGaugeCard } from "@/components/dashboard/BudgetGaugeCard";
import { BudgetProgressCard } from "@/components/dashboard/BudgetProgressCard";
import { CategoryBreakdownChart } from "@/components/dashboard/CategoryBreakdownChart";
import { MonthlyTrendChart } from "@/components/dashboard/MonthlyTrendChart";
import { PeriodPicker } from "@/components/dashboard/PeriodPicker";
import { TransactionList } from "@/components/dashboard/TransactionList";
import { PageContainer } from "@/components/shared/PageContainer";
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
    <PageContainer className="flex flex-col gap-3 p-3 md:p-4 lg:h-[calc(100dvh-4rem)] lg:max-h-[calc(100dvh-4rem)] lg:overflow-hidden">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <div className="flex flex-wrap items-center gap-2">
          <PeriodPicker referenceDate={referenceDate} />
          <Link href="/transactions" className={buttonVariants({ variant: "outline", size: "sm" })}>
            Ver todas as transações
          </Link>
        </div>
      </div>

      <div className="shrink-0">
        <BalanceSummaryCards {...resumo} />
      </div>

      <div className="grid min-h-0 gap-3 lg:flex-1 lg:grid-cols-12 lg:grid-rows-2">
        <div className="min-h-0 lg:col-span-7">
          <MonthlyTrendChart data={tendencia} />
        </div>
        <div className="min-h-0 lg:col-span-5">
          <BudgetGaugeCard orcamentos={orcamentos} />
        </div>

        <div className="min-h-0 lg:col-span-4">
          <CategoryBreakdownChart data={categorias} />
        </div>
        <div className="min-h-0 lg:col-span-4">
          <BudgetProgressCard orcamentos={orcamentos} />
        </div>
        <div className="min-h-0 lg:col-span-4">
          <TransactionList transactions={recentes} />
        </div>
      </div>
    </PageContainer>
  );
}
