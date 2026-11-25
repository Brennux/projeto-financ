"use client";

import { Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrencyBRL } from "@/lib/format";
import { TIPO_COLORS, corPorTema } from "@/lib/constants/chart-colors";
import { useTema } from "@/hooks/use-tema";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import type { PontoTendencia } from "@/lib/queries/transactions";

interface Props {
  data: PontoTendencia[];
}

const NOMES_SERIE = {
  receitas: "Receitas",
  despesas: "Despesas",
} as const;

/**
 * Ponto so no ultimo mes (o atual), com um anel pulsando -- marca o "agora"
 * sem poluir os outros meses.
 */
function pontoNoUltimoMes(cor: string, total: number) {
  return function desenharPonto(props: { cx?: number; cy?: number; index?: number }) {
    const { cx, cy, index } = props;
    if (index !== total - 1 || cx == null || cy == null) return <g key={`ponto-${index}`} />;
    return (
      <g key={`ponto-${index}`}>
        <circle cx={cx} cy={cy} r={6} fill={cor} className="ponto-pulso" />
        <circle cx={cx} cy={cy} r={4} fill={cor} stroke="var(--card)" strokeWidth={2} />
      </g>
    );
  };
}

export function MonthlyTrendChart({ data }: Props) {
  const tema = useTema();
  const reduzirMovimento = useReducedMotion();

  const corReceita = corPorTema(TIPO_COLORS.receita, tema);
  const corDespesa = corPorTema(TIPO_COLORS.despesa, tema);

  return (
    <Card className="h-full min-h-80 lg:min-h-0">
      <CardHeader className="shrink-0">
        <CardTitle>Receitas x despesas nos últimos meses</CardTitle>
      </CardHeader>
      <CardContent className="min-h-0 flex-1">
        {/* As linhas ganham um brilho suave na propria cor (filtro SVG la embaixo). */}
        <div className="size-full min-h-64 lg:min-h-0 [&_.recharts-area-curve]:filter-[url(#brilho-linha)]">
          <ResponsiveContainer>
            <AreaChart data={data} margin={{ left: 8, right: 12, top: 8, bottom: 4 }}>
              <defs>
                <filter id="brilho-linha" x="-5%" y="-30%" width="110%" height="160%">
                  <feGaussianBlur in="SourceGraphic" stdDeviation="3.5" result="desfoque" />
                  <feComponentTransfer in="desfoque" result="brilho">
                    <feFuncA type="linear" slope="0.55" />
                  </feComponentTransfer>
                  <feMerge>
                    <feMergeNode in="brilho" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                <linearGradient id="gradienteReceita" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={corReceita} stopOpacity={0.35} />
                  <stop offset="95%" stopColor={corReceita} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradienteDespesa" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={corDespesa} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={corDespesa} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 6" />
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
                  background: "color-mix(in oklch, var(--popover) 92%, transparent)",
                  backdropFilter: "blur(12px)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-lg)",
                  boxShadow: "var(--elev-pop)",
                  color: "var(--popover-foreground)",
                  padding: "8px 12px",
                }}
                animationDuration={200}
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
                dot={pontoNoUltimoMes(corReceita, data.length)}
                activeDot={{ r: 4 }}
                isAnimationActive={!reduzirMovimento}
                animationDuration={900}
                animationEasing="ease-out"
              />
              <Area
                type="monotone"
                dataKey="despesas"
                stroke={corDespesa}
                strokeWidth={2.5}
                fill="url(#gradienteDespesa)"
                dot={pontoNoUltimoMes(corDespesa, data.length)}
                activeDot={{ r: 4 }}
                isAnimationActive={!reduzirMovimento}
                animationDuration={900}
                animationEasing="ease-out"
                animationBegin={150}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
