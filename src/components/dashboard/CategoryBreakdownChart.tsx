"use client";

import { Bar, BarChart, Cell, LabelList, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/EmptyState";
import { formatCurrencyBRL } from "@/lib/format";
import { corPorTema } from "@/lib/constants/chart-colors";
import { useCategorias } from "@/components/categorias/CategoriasProvider";
import { useTema } from "@/hooks/use-tema";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import type { CategoriaTotal } from "@/lib/queries/transactions";

interface Props {
  data: CategoriaTotal[];
}

// Largura media aproximada de um caractere a 12px -- o SVG do recharts nao
// mede texto, entao as margens sao reservadas a partir do maior rotulo pra
// nada sair cortado (o "R$ 350,0" truncado na borda direita).
const LARGURA_CARACTERE_PX = 7.2;
const ALTURA_LINHA_MOBILE_PX = 36;

export function CategoryBreakdownChart({ data }: Props) {
  const tema = useTema();
  const reduzirMovimento = useReducedMotion();
  const categorias = useCategorias();

  const maiorValor = Math.max(0, ...data.map((d) => formatCurrencyBRL(d.total).length));
  const maiorCategoria = Math.max(0, ...data.map((d) => d.categoria.length));
  const margemDireita = Math.ceil(maiorValor * LARGURA_CARACTERE_PX) + 12;
  const larguraEixo = Math.min(120, Math.max(56, Math.ceil(maiorCategoria * 6.6) + 12));

  return (
    <Card className="h-full min-h-72 lg:min-h-0">
      <CardHeader className="shrink-0">
        <CardTitle>Despesas por categoria</CardTitle>
      </CardHeader>
      <CardContent className="min-h-0 flex-1">
        {data.length === 0 ? (
          <EmptyState message="Nenhuma despesa registrada nesse período ainda." />
        ) : (
          // No mobile o card cresce com o conteudo (altura minima por linha);
          // no desktop ocupa exatamente o espaco do card -- nunca rola.
          <div
            className="h-full min-h-(--altura-minima) w-full lg:min-h-0"
            style={{ "--altura-minima": `${data.length * ALTURA_LINHA_MOBILE_PX}px` } as React.CSSProperties}
          >
            <ResponsiveContainer>
              <BarChart
                data={data}
                layout="vertical"
                margin={{ left: 0, right: margemDireita, top: 0, bottom: 0 }}
                barCategoryGap="22%"
              >
                <XAxis type="number" hide domain={[0, "dataMax"]} />
                <YAxis
                  type="category"
                  dataKey="categoria"
                  width={larguraEixo}
                  interval={0}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                />
                <Bar
                  dataKey="total"
                  radius={[0, 6, 6, 0]}
                  maxBarSize={22}
                  // Trilho apagado atras de cada barra: le como um medidor.
                  background={{ fill: "var(--muted)", radius: 6 }}
                  isAnimationActive={!reduzirMovimento}
                  animationDuration={800}
                  animationEasing="ease-out"
                >
                  {data.map((entry) => (
                    <Cell key={entry.categoria} fill={corPorTema(categorias.cor(entry.categoria), tema)} />
                  ))}
                  <LabelList
                    dataKey="total"
                    position="right"
                    offset={8}
                    formatter={(value) => formatCurrencyBRL(Number(value))}
                    style={{ fill: "var(--foreground)", fontSize: 12, fontVariantNumeric: "tabular-nums" }}
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
