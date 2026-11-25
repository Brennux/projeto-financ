import Link from "next/link";
import { CreditCard, Plus } from "lucide-react";
import { verifySession } from "@/lib/auth/dal";
import { getResumoDosCartoes } from "@/lib/cartoes/server";
import { formatCurrencyBRL, formatDatePtBr } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageContainer } from "@/components/shared/PageContainer";
import { PageHeader } from "@/components/shared/PageHeader";
import { CartaoVisual } from "@/components/cartoes/CartaoVisual";
import { CartaoFormDialog } from "@/components/cartoes/CartaoFormDialog";
import { BotaoPagarFatura, SeloStatusFatura } from "@/components/cartoes/StatusFatura";

export default async function CardsPage() {
  const session = await verifySession();
  const cartoes = await getResumoDosCartoes(session.householdId, true);

  const novoCartao = (
    <CartaoFormDialog
      trigger={
        <Button>
          <Plus className="size-4" />
          Novo cartão
        </Button>
      }
    />
  );

  return (
    <PageContainer>
      <PageHeader
        title="Cartões"
        description="Faturas, limite e parcelas de cada cartão. As compras contam no mês da fatura."
        backHref="/"
        backLabel="← Voltar ao dashboard"
        actions={novoCartao}
      />

      {cartoes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <span className="flex size-14 items-center justify-center rounded-2xl bg-primary/12 text-primary">
              <CreditCard className="size-7" aria-hidden />
            </span>
            <p className="text-base font-semibold">Nenhum cartão cadastrado</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Cadastre seus cartões com o dia de fechamento e de vencimento. Depois é só escolher o cartão ao lançar
              uma compra (ou dizer &quot;no nubank em 10x&quot; no WhatsApp).
            </p>
            {novoCartao}
          </CardContent>
        </Card>
      ) : (
        <div className="stagger-in grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {cartoes.map((c) => {
            const usadoPct = c.limite ? Math.min(1, c.limiteUsado / c.limite) : null;
            const comprometido = c.proximas.reduce((soma, f) => soma + f.total, 0);
            return (
              <Card key={c.id} className="gap-4">
                <CardContent className="flex flex-col gap-4">
                  <Link
                    href={`/cards/${c.id}`}
                    aria-label={`Abrir faturas do ${c.nome}`}
                    className="block rounded-2xl transition-transform duration-300 ease-out hover:-translate-y-1 hover:rotate-[-0.5deg] focus-visible:ring-4 focus-visible:ring-ring/30 focus-visible:outline-none"
                  >
                    <CartaoVisual
                      nome={c.nome}
                      cor={c.cor}
                      arquivado={!c.ativo}
                      rotuloDestaque={`Fatura de ${new Date(c.faturaAtual.vencimento).toLocaleDateString("pt-BR", { month: "long", timeZone: "UTC" })}`}
                      destaque={formatCurrencyBRL(c.faturaAtual.total)}
                      rodape={`fecha dia ${c.diaFechamento} · vence dia ${c.diaVencimento}${c.ativo ? "" : " · arquivado"}`}
                    />
                  </Link>

                  {c.aPagar && (
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/70 bg-muted/40 p-3">
                      <div className="flex flex-col gap-1">
                        <span className="flex items-center gap-2 text-sm font-semibold">
                          A pagar: {formatCurrencyBRL(c.aPagar.total)}
                          <SeloStatusFatura status={c.aPagar.status} />
                        </span>
                        <span className="text-xs text-muted-foreground">Vence {formatDatePtBr(c.aPagar.vencimento)}</span>
                      </div>
                      <BotaoPagarFatura cartaoId={c.id} mes={c.aPagar.mes} paga={false} tamanho="sm" />
                    </div>
                  )}

                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      Fatura atual <SeloStatusFatura status={c.faturaAtual.status} />
                    </span>
                    <span className="text-xs text-muted-foreground">fecha {formatDatePtBr(c.faturaAtual.fechamento)}</span>
                  </div>

                  {usadoPct !== null && c.limite && (
                    <div className="flex flex-col gap-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Limite disponível</span>
                        <span className="font-semibold tabular-nums">
                          {formatCurrencyBRL(Math.max(0, c.limite - c.limiteUsado))}{" "}
                          <span className="font-normal text-muted-foreground">de {formatCurrencyBRL(c.limite)}</span>
                        </span>
                      </div>
                      <div
                        className="h-2 overflow-hidden rounded-full bg-muted"
                        role="img"
                        aria-label={`${Math.round(usadoPct * 100)}% do limite usado`}
                      >
                        <div
                          className="h-full origin-left animate-[grow-x_900ms_cubic-bezier(0.22,1,0.36,1)] rounded-full bg-linear-to-r from-primary to-primary-2"
                          style={{ width: `${usadoPct * 100}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {comprometido > 0 && (
                    <p className="text-xs text-muted-foreground">
                      <span className="font-semibold text-foreground">{formatCurrencyBRL(comprometido)}</span> já
                      comprometidos em parcelas nos próximos meses.
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </PageContainer>
  );
}
