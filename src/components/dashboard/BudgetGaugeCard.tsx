"use client";

import Link from "next/link";
import { PolarAngleAxis, RadialBar, RadialBarChart, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/EmptyState";
import { formatCurrencyBRL } from "@/lib/format";
import { STATUS_COLORS, corPorTema } from "@/lib/constants/chart-colors";
import { useTema } from "@/hooks/use-tema";
import type { OrcamentoComGasto, StatusOrcamento } from "@/lib/queries/budgets";

interface Props {
  orcamentos: OrcamentoComGasto[];
}

function statusAgregado(percentual: number): StatusOrcamento {
  if (percentual >= 1) return "critical";
  if (percentual >= 0.8) return "warning";
  return "good";
}

export function BudgetGaugeCard({ orcamentos }: Props) {
  const tema = useTema();

  const totalLimite = orcamentos.reduce((soma, o) => soma + o.limite, 0);
  const totalGasto = orcamentos.reduce((soma, o) => soma + o.gasto, 0);

  if (orcamentos.length === 0 || totalLimite === 0) {
    return (
      <Card className="flex h-full min-h-56 flex-col lg:min-h-0">
        <CardHeader className="shrink-0">
          <CardTitle>Orçamento do mês</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-1 items-center">
          <EmptyState
            message="Nenhum orçamento definido ainda."
            action={
              <Link href="/settings/budgets" className="text-sm text-primary hover:underline">
                Definir um limite por categoria
              </Link>
            }
          />
        </CardContent>
      </Card>
    );
  }

  const percentual = totalGasto / totalLimite;
  const status = statusAgregado(percentual);
  const cor = corPorTema(STATUS_COLORS[status], tema);
  const data = [{ nome: "usado", valor: Math.min(percentual, 1) * 100 }];

  return (
    <Card className="flex h-full min-h-56 flex-col lg:min-h-0">
      <CardHeader className="shrink-0">
        <CardTitle>Orçamento do mês</CardTitle>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col items-center justify-center gap-2">
        <div className="relative flex size-28 shrink items-center justify-center xl:size-36">
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart
              data={data}
              innerRadius="80%"
              outerRadius="100%"
              startAngle={90}
              endAngle={-270}
            >
              <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
              <RadialBar
                dataKey="valor"
                fill={cor}
                background={{ fill: "var(--muted)" }}
                cornerRadius={12}
                isAnimationActive={false}
              />
            </RadialBarChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-semibold tabular-nums xl:text-3xl" style={{ color: cor }}>
              {Math.round(percentual * 100)}%
            </span>
            <span className="text-xs text-muted-foreground">utilizado</span>
          </div>
        </div>
        <p className="shrink-0 text-center text-sm text-muted-foreground">
          {formatCurrencyBRL(totalGasto)} de {formatCurrencyBRL(totalLimite)}
        </p>
      </CardContent>
    </Card>
  );
}
