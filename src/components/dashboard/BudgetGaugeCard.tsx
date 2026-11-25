"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, OctagonAlert } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/EmptyState";
import { NumeroAnimado } from "@/components/shared/NumeroAnimado";
import { formatCurrencyBRL } from "@/lib/format";
import { STATUS_COLORS } from "@/lib/constants/chart-colors";
import type { OrcamentoComGasto, StatusOrcamento } from "@/lib/queries/budgets";

interface Props {
  orcamentos: OrcamentoComGasto[];
}

/** Segmentos do anel e o arco que ele cobre (aberto embaixo, como um velocimetro). */
const SEGMENTOS = 40;
const ARCO_GRAUS = 270;

const formatoPercentual = (v: number) => `${Math.round(v)}%`;
const assinarNada = () => () => {};

function statusAgregado(percentual: number): StatusOrcamento {
  if (percentual >= 1) return "critical";
  if (percentual >= 0.8) return "warning";
  return "good";
}

const ROTULO_STATUS: Record<StatusOrcamento, { texto: string; Icone: typeof CheckCircle2 }> = {
  good: { texto: "Dentro do orçamento", Icone: CheckCircle2 },
  warning: { texto: "Perto do limite", Icone: AlertTriangle },
  critical: { texto: "Orçamento estourado", Icone: OctagonAlert },
};

export function BudgetGaugeCard({ orcamentos }: Props) {
  // Os segmentos acendem um a um depois de montar (no servidor, todos apagados).
  const montado = useSyncExternalStore(assinarNada, () => true, () => false);

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
  const cor = STATUS_COLORS[status];
  const acesos = Math.round(Math.min(percentual, 1) * SEGMENTOS);
  const { texto, Icone } = ROTULO_STATUS[status];
  const estiloCor = { "--cor-claro": cor.light, "--cor-escuro": cor.dark } as React.CSSProperties;

  return (
    <Card className="flex h-full min-h-56 flex-col lg:min-h-0" style={estiloCor}>
      <CardHeader className="shrink-0">
        <CardTitle>Orçamento do mês</CardTitle>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col items-center justify-center gap-2">
        <div
          role="img"
          aria-label={`${Math.round(percentual * 100)}% do orçamento do mês utilizado`}
          className="relative aspect-square w-32 shrink [--raio:4rem] xl:w-40 xl:[--raio:5rem]"
        >
          {Array.from({ length: SEGMENTOS }, (_, i) => {
            const aceso = montado && i < acesos;
            const ultimo = aceso && i === acesos - 1;
            return (
              <span
                key={i}
                aria-hidden
                className="absolute top-0 left-1/2 -ml-[1.5px] h-[calc(var(--raio)*0.2)] w-[3px] origin-[50%_var(--raio)] rounded-full bg-foreground/10 transition-[background-color,box-shadow,opacity] duration-500 ease-out data-aceso:bg-(--cor-claro) dark:data-aceso:bg-(--cor-escuro)"
                data-aceso={aceso ? "" : undefined}
                style={{
                  transform: `rotate(${-ARCO_GRAUS / 2 + (i * ARCO_GRAUS) / (SEGMENTOS - 1)}deg)`,
                  // Degrade ao longo do arco: comeca mais suave e termina cheio.
                  opacity: aceso ? 0.45 + (0.55 * (i + 1)) / acesos : 1,
                  boxShadow: ultimo ? "0 0 10px var(--cor-claro)" : undefined,
                  transitionDelay: `${250 + i * 22}ms`,
                }}
              />
            );
          })}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <NumeroAnimado
              valor={percentual * 100}
              formatar={formatoPercentual}
              className="text-2xl font-semibold tracking-tight tabular-nums xl:text-3xl"
            />
            <span className="text-xs text-muted-foreground">utilizado</span>
          </div>
        </div>
        <p className="shrink-0 text-center text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">{formatCurrencyBRL(totalGasto)}</span> de{" "}
          {formatCurrencyBRL(totalLimite)}
        </p>
        <span className="inline-flex h-6 shrink-0 items-center gap-1.5 rounded-full bg-(--cor-claro)/12 px-2.5 text-xs font-semibold text-foreground dark:bg-(--cor-escuro)/15">
          <Icone className="size-3.5 text-(--cor-claro) dark:text-(--cor-escuro)" aria-hidden />
          {texto}
        </span>
      </CardContent>
    </Card>
  );
}
