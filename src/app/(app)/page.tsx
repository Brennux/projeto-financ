import Link from "next/link";
import { format, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import prisma from "@/lib/prisma";
import { primeiroNome } from "@/lib/format";
import { BalanceSummaryCards } from "@/components/dashboard/BalanceSummaryCards";
import { FaturasCard } from "@/components/dashboard/FaturasCard";
import { getResumoDosCartoes } from "@/lib/cartoes/server";
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
import { materializarRecorrencias } from "@/lib/recorrencias/server";
import {
  getDespesasPorCategoria,
  getGastosPorPessoa,
  getResumoMensal,
  getSaldoDiario,
  getTendenciaMensal,
  getTransacoesRecentes,
} from "@/lib/queries/transactions";

// "domingo, 22 de novembro" -- no fuso do Brasil (o servidor roda em UTC).
const dataDeHoje = new Intl.DateTimeFormat("pt-BR", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: "America/Sao_Paulo",
});

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

  // Lancamentos recorrentes que venceram desde a ultima visita entram antes das consultas.
  await materializarRecorrencias(session.householdId);

  const mesAnteriorData = subMonths(referenceDate, 1);
  const [resumo, resumoAnterior, saldoDiario, categorias, tendencia, recentes, orcamentos, porPessoa, usuario, cartoes] =
    await Promise.all([
      getResumoMensal(session.householdId, referenceDate),
      getResumoMensal(session.householdId, mesAnteriorData),
      getSaldoDiario(session.householdId, referenceDate),
      getDespesasPorCategoria(session.householdId, referenceDate),
      getTendenciaMensal(session.householdId, referenceDate),
      getTransacoesRecentes(session.householdId, 8, referenceDate),
      getOrcamentosComGasto(session.householdId, referenceDate),
      getGastosPorPessoa(session.householdId, referenceDate),
      prisma.user.findUnique({ where: { id: session.userId }, select: { nome: true } }),
      getResumoDosCartoes(session.householdId),
    ]);
  const temCartoes = cartoes.length > 0;

  return (
    <PageContainer className="flex flex-col gap-3 p-3 md:p-4 lg:h-[calc(100dvh-4rem)] lg:max-h-[calc(100dvh-4rem)] lg:overflow-hidden">
      <div className="flex shrink-0 flex-wrap items-end justify-between gap-x-4 gap-y-2">
        <div className="flex flex-col gap-0.5">
          <span className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
            {dataDeHoje.format(new Date())}
          </span>
          <h1 className="text-2xl font-semibold tracking-tight">
            Olá, {usuario ? primeiroNome(usuario.nome) : "tudo bem"}
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <PeriodPicker referenceDate={referenceDate} />
          <Link href="/transactions" className={buttonVariants({ variant: "outline", size: "sm" })}>
            Ver todas as transações
          </Link>
        </div>
      </div>

      <div className="shrink-0">
        <BalanceSummaryCards
          {...resumo}
          gastosPorPessoa={porPessoa}
          saldoAnterior={resumoAnterior.saldo}
          saldoDiario={saldoDiario}
          mes={format(referenceDate, "MMMM", { locale: ptBR })}
          mesAnterior={format(mesAnteriorData, "MMMM", { locale: ptBR })}
        />
      </div>

      <div className="stagger-in grid min-h-0 gap-3 lg:flex-1 lg:grid-cols-12 lg:grid-rows-2">
        {/* Com cartoes, a primeira linha abre espaco pro card de faturas. */}
        <div className={temCartoes ? "min-h-0 lg:col-span-5" : "min-h-0 lg:col-span-7"}>
          <MonthlyTrendChart data={tendencia} />
        </div>
        <div className={temCartoes ? "min-h-0 lg:col-span-3" : "min-h-0 lg:col-span-5"}>
          <BudgetGaugeCard orcamentos={orcamentos} />
        </div>
        {temCartoes && (
          <div className="min-h-0 lg:col-span-4">
            <FaturasCard cartoes={cartoes} />
          </div>
        )}

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
