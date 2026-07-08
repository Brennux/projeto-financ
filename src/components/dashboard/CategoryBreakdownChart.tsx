"use client";

import { useTheme } from "next-themes";
import { Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/EmptyState";
import { formatCurrencyBRL } from "@/lib/format";
import { CATEGORIA_COLORS, corPorTema } from "@/lib/constants/chart-colors";
import type { CategoriaTotal } from "@/lib/queries/transactions";

interface Props {
  data: CategoriaTotal[];
}

export function CategoryBreakdownChart({ data }: Props) {
  const { resolvedTheme } = useTheme();
  const tema = resolvedTheme === "dark" ? "dark" : "light";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Despesas por categoria</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <EmptyState message="Nenhuma despesa registrada nesse período ainda." />
        ) : (
          <div style={{ width: "100%", height: Math.max(data.length * 40, 120) }}>
            <ResponsiveContainer>
              <BarChart data={data} layout="vertical" margin={{ left: 8, right: 48, top: 4, bottom: 4 }}>
                <CartesianGrid horizontal={false} stroke="var(--border)" />
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="categoria"
                  width={90}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                />
                <Tooltip
                  cursor={{ fill: "var(--accent)" }}
                  formatter={(value) => formatCurrencyBRL(Number(value))}
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius-md)",
                    color: "var(--popover-foreground)",
                  }}
                />
                <Bar dataKey="total" radius={[0, 4, 4, 0]} maxBarSize={24} isAnimationActive={false}>
                  {data.map((entry) => (
                    <Cell key={entry.categoria} fill={corPorTema(CATEGORIA_COLORS[entry.categoria], tema)} />
                  ))}
                  <LabelList
                    dataKey="total"
                    position="right"
                    formatter={(value) => formatCurrencyBRL(Number(value))}
                    style={{ fill: "var(--foreground)", fontSize: 12 }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
