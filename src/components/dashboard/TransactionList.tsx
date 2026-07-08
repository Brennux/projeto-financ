"use client";

import { useTheme } from "next-themes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/EmptyState";
import { formatCurrencyBRL, formatDatePtBr } from "@/lib/format";
import { getCategoriaIcon } from "@/lib/constants/categoria-icons";
import { TIPO_COLORS, corPorTema } from "@/lib/constants/chart-colors";
import type { TransacaoResumida } from "@/lib/queries/transactions";

interface Props {
  transactions: TransacaoResumida[];
}

export function TransactionList({ transactions }: Props) {
  const { resolvedTheme } = useTheme();
  const tema = resolvedTheme === "dark" ? "dark" : "light";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transações recentes</CardTitle>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <EmptyState message="Nenhuma transação nesse período. Mande uma mensagem no self-chat do WhatsApp ou adicione manualmente." />
        ) : (
          <ul className="flex flex-col divide-y divide-border">
            {transactions.map((t) => {
              const Icone = getCategoriaIcon(t.categoria);
              const corTipo = corPorTema(TIPO_COLORS[t.tipo], tema);

              return (
                <li key={t.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-foreground">
                    <Icone className="size-[1.1rem]" aria-hidden />
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{t.descricao || t.categoria}</p>
                    <p className="truncate text-xs text-muted-foreground">{t.categoria}</p>
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
        )}
      </CardContent>
    </Card>
  );
}
