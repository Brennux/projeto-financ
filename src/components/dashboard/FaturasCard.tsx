import Link from "next/link";
import { CreditCard } from "lucide-react";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { FitToHeight } from "@/components/shared/FitToHeight";
import { SeloStatusFatura } from "@/components/cartoes/StatusFatura";
import { corDaCategoria } from "@/lib/categorias/cores";
import { hojeNoApp } from "@/lib/recorrencias/datas";
import { formatCurrencyBRL, formatDatePtBr } from "@/lib/format";
import type { CartaoComFaturas } from "@/lib/cartoes/server";

const UM_DIA_MS = 24 * 60 * 60 * 1000;

function prazo(vencimento: Date): string {
  const dias = Math.round((new Date(vencimento).getTime() - hojeNoApp().getTime()) / UM_DIA_MS);
  if (dias < 0) return `venceu há ${-dias} ${-dias === 1 ? "dia" : "dias"}`;
  if (dias === 0) return "vence hoje";
  if (dias === 1) return "vence amanhã";
  return `vence em ${dias} dias`;
}

/**
 * Faturas no dashboard: por cartao, a que precisa ser paga agora (fechada
 * ou vencida) ou, se nao houver, a atual em aberto.
 */
export function FaturasCard({ cartoes }: { cartoes: CartaoComFaturas[] }) {
  return (
    <Card className="flex h-full min-h-56 flex-col lg:min-h-0">
      <CardHeader className="shrink-0">
        <CardTitle>Faturas</CardTitle>
        <CardAction>
          <Link href="/cards" className={buttonVariants({ variant: "outline", size: "sm" })}>
            Cartões
          </Link>
        </CardAction>
      </CardHeader>
      <CardContent className="min-h-0 flex-1">
        <FitToHeight>
          <ul className="stagger-rows flex flex-col gap-3">
            {cartoes.map((c) => {
              const fatura = c.aPagar ?? c.faturaAtual;
              const cor = corDaCategoria(c.cor);
              return (
                <li key={c.id} data-fit-item>
                  <Link
                    href={`/cards/${c.id}`}
                    className="-mx-2 flex items-center gap-3 rounded-xl px-2 py-1.5 transition-colors hover:bg-muted/60"
                  >
                    <span
                      aria-hidden
                      className="flex h-8 w-12 shrink-0 items-center justify-center rounded-lg text-white shadow-[inset_0_1px_0_0_oklch(1_0_0/0.25)]"
                      style={{ background: `linear-gradient(135deg, ${cor.light}, color-mix(in oklch, ${cor.light}, black 40%))` }}
                    >
                      <CreditCard className="size-4" />
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="flex items-center gap-2 text-sm font-medium">
                        <span className="truncate">{c.nome}</span>
                        <SeloStatusFatura status={fatura.status} className="h-5 px-2 text-[11px]" />
                      </span>
                      <span className="truncate text-xs text-muted-foreground">
                        {fatura.status === "aberta"
                          ? `fecha ${formatDatePtBr(fatura.fechamento)}`
                          : `${prazo(fatura.vencimento)} (${formatDatePtBr(fatura.vencimento)})`}
                      </span>
                    </span>
                    <span className="shrink-0 text-sm font-semibold tabular-nums">{formatCurrencyBRL(fatura.total)}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </FitToHeight>
      </CardContent>
    </Card>
  );
}
