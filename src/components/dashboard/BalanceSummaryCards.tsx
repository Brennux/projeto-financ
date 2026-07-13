import { TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrencyBRL } from "@/lib/format";
import { STATUS_COLORS } from "@/lib/constants/chart-colors";
import type { ResumoMensal } from "@/lib/queries/transactions";

export function BalanceSummaryCards({ receitas, despesas, saldo }: ResumoMensal) {
  const saldoPositivo = saldo >= 0;

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <Card size="sm">
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Receitas do mês</CardTitle>
          <span className="flex size-9 items-center justify-center rounded-xl bg-[#008300]/10 text-[#008300] dark:bg-[#008300]/15">
            <TrendingUp className="size-4.5" aria-hidden />
          </span>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-semibold tabular-nums">{formatCurrencyBRL(receitas)}</p>
        </CardContent>
      </Card>

      <Card size="sm">
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Despesas do mês</CardTitle>
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <TrendingDown className="size-4.5" aria-hidden />
          </span>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-semibold tabular-nums">{formatCurrencyBRL(despesas)}</p>
        </CardContent>
      </Card>

      <Card size="sm">
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Saldo do mês</CardTitle>
          <span
            className="flex size-9 items-center justify-center rounded-xl"
            style={{
              backgroundColor: `color-mix(in oklch, ${saldoPositivo ? STATUS_COLORS.good.light : STATUS_COLORS.critical.light} 12%, transparent)`,
              color: saldoPositivo ? STATUS_COLORS.good.light : STATUS_COLORS.critical.light,
            }}
          >
            <Wallet className="size-4.5" aria-hidden />
          </span>
        </CardHeader>
        <CardContent>
          <p
            className="text-2xl font-semibold tabular-nums"
            style={{ color: saldoPositivo ? STATUS_COLORS.good.light : STATUS_COLORS.critical.light }}
          >
            {formatCurrencyBRL(saldo)}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
