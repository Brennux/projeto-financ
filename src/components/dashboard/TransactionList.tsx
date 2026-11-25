"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/EmptyState";
import { FitToHeight } from "@/components/shared/FitToHeight";
import { formatCurrencyBRL, formatDatePtBr, primeiroNome } from "@/lib/format";
import { useCategorias } from "@/components/categorias/CategoriasProvider";
import { TIPO_COLORS, corPorTema } from "@/lib/constants/chart-colors";
import { useTema } from "@/hooks/use-tema";
import type { TransacaoResumida } from "@/lib/queries/transactions";

interface Props {
  transactions: TransacaoResumida[];
}

export function TransactionList({ transactions }: Props) {
  const tema = useTema();
  const categorias = useCategorias();

  return (
    <Card className="flex h-full min-h-64 flex-col lg:min-h-0">
      <CardHeader className="shrink-0">
        <CardTitle>Transações recentes</CardTitle>
      </CardHeader>
      <CardContent className="min-h-0 flex-1">
        {transactions.length === 0 ? (
          <EmptyState message="Nenhuma transação nesse período. Mande um gasto pro bot no WhatsApp ou adicione manualmente." />
        ) : (
          <FitToHeight>
            <ul className="stagger-rows flex flex-col divide-y divide-border/70">
              {transactions.map((t) => {
                const Icone = categorias.icone(t.categoria);
                const corTipo = corPorTema(TIPO_COLORS[t.tipo], tema);

                return (
                  <li key={t.id} data-fit-item className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                    <span
                      className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-(--cor-claro)/12 text-(--cor-claro) dark:bg-(--cor-escuro)/18 dark:text-(--cor-escuro)"
                      style={{ "--cor-claro": categorias.cor(t.categoria).light, "--cor-escuro": categorias.cor(t.categoria).dark } as React.CSSProperties}
                    >
                      <Icone className="size-[1.1rem]" aria-hidden />
                    </span>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{t.descricao || t.categoria}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {t.cartao ? `${t.cartao.nome} · ` : ""}
                        {t.categoria}
                        {t.parcelaTotal ? ` · ${t.parcelaNumero}/${t.parcelaTotal}` : ""}
                        {t.autor && ` · ${primeiroNome(t.autor.nome)}`}
                      </p>
                    </div>

                    <div className="shrink-0 text-right">
                      <p className="text-sm font-semibold tabular-nums" style={{ color: corTipo }}>
                        {t.tipo === "despesa" ? "-" : "+"}
                        {formatCurrencyBRL(t.valor)}
                      </p>
                      <p className="text-xs text-muted-foreground">{formatDatePtBr(t.data)}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </FitToHeight>
        )}
      </CardContent>
    </Card>
  );
}
