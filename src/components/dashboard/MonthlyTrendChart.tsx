"use client";

import { useTheme } from "next-themes";
import { Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrencyBRL } from "@/lib/format";
import { TIPO_COLORS, corPorTema } from "@/lib/constants/chart-colors";
import type { PontoTendencia } from "@/lib/queries/transactions";

interface Props {
  data: PontoTendencia[];
}

const NOMES_SERIE = {
  receitas: "Receitas",
  despesas: "Despesas",
} as const;

export function MonthlyTrendChart({ data }: Props) {
  const { resolvedTheme } = useTheme();
  const tema = resolvedTheme === "dark" ? "dark" : "light";

  const corReceita = corPorTema(TIPO_COLORS.receita, tema);
  const corDespesa = corPorTema(TIPO_COLORS.despesa, tema);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Receitas x despesas nos últimos meses</CardTitle>
      </CardHeader>
      <CardContent>
        <div style={{ width: "100%", height: 300 }}>
          <ResponsiveContainer>
            <AreaChart data={data} margin={{ left: 8, right: 8, top: 4, bottom: 4 }}>
              <defs>
                <linearGradient id="gradienteReceita" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={corReceita} stopOpacity={0.35} />
                  <stop offset="95%" stopColor={corReceita} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradienteDespesa" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={corDespesa} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={corDespesa} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="var(--border)" />
              <XAxis
                dataKey="mes"
                tickLine={false}
                axisLine={{ stroke: "var(--border)" }}
                tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                tickFormatter={(value: number) => formatCurrencyBRL(value)}
                width={80}
              />
              <Tooltip
                cursor={{ stroke: "var(--border)", strokeWidth: 1 }}
                formatter={(value, name) => [
                  formatCurrencyBRL(Number(value)),
                  NOMES_SERIE[name as keyof typeof NOMES_SERIE] ?? String(name ?? ""),
                ]}
                contentStyle={{
                  background: "var(--popover)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-md)",
                  color: "var(--popover-foreground)",
                }}
              />
              <Legend
                formatter={(value: string) => NOMES_SERIE[value as keyof typeof NOMES_SERIE] ?? value}
                wrapperStyle={{ color: "var(--muted-foreground)", fontSize: 12 }}
              />
              <Area
                type="monotone"
                dataKey="receitas"
                stroke={corReceita}
                strokeWidth={2.5}
                fill="url(#gradienteReceita)"
                dot={false}
                activeDot={{ r: 4 }}
                isAnimationActive={false}
              />
              <Area
                type="monotone"
                dataKey="despesas"
                stroke={corDespesa}
                strokeWidth={2.5}
                fill="url(#gradienteDespesa)"
                dot={false}
                activeDot={{ r: 4 }}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
