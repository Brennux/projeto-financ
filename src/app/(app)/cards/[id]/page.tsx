import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, ChevronRight, ShoppingBag } from "lucide-react";
import prisma from "@/lib/prisma";
import { verifySession } from "@/lib/auth/dal";
import { getCartao, getFatura, getResumoDosCartoes } from "@/lib/cartoes/server";
import { chaveDoMes, lerMesDaFatura, mesDaFaturaAtual } from "@/lib/cartoes/fatura";
import { getCategorias } from "@/lib/categorias/server";
import { corDaCategoria } from "@/lib/categorias/cores";
import { iconeDaCategoria } from "@/lib/categorias/icones";
import { formatCurrencyBRL, formatDatePtBr, primeiroNome } from "@/lib/format";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageContainer } from "@/components/shared/PageContainer";
import { PageHeader } from "@/components/shared/PageHeader";
import { NumeroAnimado } from "@/components/shared/NumeroAnimado";
import { CartaoVisual } from "@/components/cartoes/CartaoVisual";
import { AcoesCartao } from "@/components/cartoes/AcoesCartao";
import { BotaoPagarFatura, SeloStatusFatura } from "@/components/cartoes/StatusFatura";
import { cn } from "@/lib/utils";

const nomeDoMes = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" });
const mesCurto = new Intl.DateTimeFormat("pt-BR", { month: "short", year: "2-digit", timeZone: "UTC" });

function capitalizar(texto: string): string {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

function somarMes(mes: Date, n: number): Date {
  return new Date(Date.UTC(mes.getUTCFullYear(), mes.getUTCMonth() + n, 1));
}

interface Props {
  params: Promise<{ id: string }>;
  /** mes=yyyy-mm: fatura (pelo mes do vencimento). Sem ele, a fatura atual. */
  searchParams: Promise<{ mes?: string }>;
}

export default async function CardPage({ params, searchParams }: Props) {
  const [{ id }, { mes: mesTexto }] = await Promise.all([params, searchParams]);
  const session = await verifySession();
  const cartao = await getCartao(session.householdId, id);
  if (!cartao) notFound();

  const mesAtual = mesDaFaturaAtual(cartao);
  const mes = lerMesDaFatura(mesTexto) ?? mesAtual;

  const [fatura, resumos, categorias, totalLancamentos] = await Promise.all([
    getFatura(session.householdId, cartao, mes),
    getResumoDosCartoes(session.householdId, true),
    getCategorias(session.householdId),
    prisma.transaction.count({ where: { cartaoId: cartao.id } }),
  ]);
  const resumo = resumos.find((r) => r.id === cartao.id)!;
  const corPorCategoria = new Map(categorias.map((c) => [c.nome, c]));
  const maiorProxima = Math.max(1, ...resumo.proximas.map((f) => f.total));
  const link = (m: Date) => `/cards/${cartao.id}?mes=${chaveDoMes(m)}`;

  return (
    <PageContainer>
      <PageHeader
        title={cartao.nome}
        description={`Fecha dia ${cartao.diaFechamento} · vence dia ${cartao.diaVencimento}${cartao.ativo ? "" : " · arquivado"}`}
        backHref="/cards"
        backLabel="← Cartões"
        actions={<AcoesCartao cartao={cartao} temLancamentos={totalLancamentos > 0} />}
      />

      <div className="grid items-start gap-5 lg:grid-cols-[22rem_minmax(0,1fr)]">
        <div className="stagger-in flex flex-col gap-5">
          <CartaoVisual
            nome={cartao.nome}
            cor={cartao.cor}
            arquivado={!cartao.ativo}
            rotuloDestaque="Fatura atual"
            destaque={formatCurrencyBRL(resumo.faturaAtual.total)}
            rodape={`fecha ${formatDatePtBr(resumo.faturaAtual.fechamento)} · vence ${formatDatePtBr(resumo.faturaAtual.vencimento)}`}
          />

          {cartao.limite && (
            <Card size="sm">
              <CardContent className="flex flex-col gap-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Limite disponível</span>
                  <span className="font-semibold tabular-nums">
                    {formatCurrencyBRL(Math.max(0, cartao.limite - resumo.limiteUsado))}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full origin-left animate-[grow-x_900ms_cubic-bezier(0.22,1,0.36,1)] rounded-full bg-linear-to-r from-primary to-primary-2"
                    style={{ width: `${Math.min(100, (resumo.limiteUsado / cartao.limite) * 100)}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatCurrencyBRL(resumo.limiteUsado)} usados de {formatCurrencyBRL(cartao.limite)} (inclui parcelas
                  futuras e faturas não pagas).
                </p>
              </CardContent>
            </Card>
          )}

          <Card size="sm">
            <CardHeader>
              <CardTitle>Próximas faturas</CardTitle>
            </CardHeader>
            <CardContent>
              {resumo.proximas.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma parcela para os próximos meses.</p>
              ) : (
                <ul className="stagger-rows flex flex-col gap-2.5">
                  {resumo.proximas.map((f) => {
                    const m = lerMesDaFatura(f.mes)!;
                    return (
                      <li key={f.mes}>
                        <Link
                          href={link(m)}
                          className="group/prox flex items-center gap-3 rounded-lg text-sm transition-colors hover:text-foreground"
                        >
                          <span className="w-14 shrink-0 text-muted-foreground capitalize">{mesCurto.format(m)}</span>
                          <span className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                            <span
                              className="block h-full origin-left animate-[grow-x_900ms_cubic-bezier(0.22,1,0.36,1)] rounded-full bg-primary/70 transition-colors group-hover/prox:bg-primary"
                              style={{ width: `${(f.total / maiorProxima) * 100}%` }}
                            />
                          </span>
                          <span className="w-24 shrink-0 text-right font-medium tabular-nums">{formatCurrencyBRL(f.total)}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-1 rounded-full border border-border/70 bg-card/60 p-1">
                <Link href={link(somarMes(mes, -1))} aria-label="Fatura anterior" className={buttonVariants({ variant: "ghost", size: "icon-sm" })}>
                  <ChevronLeft className="size-4" />
                </Link>
                <span key={fatura.mes} className="min-w-40 animate-in text-center text-sm font-semibold capitalize fade-in-0 slide-in-from-bottom-1">
                  {capitalizar(nomeDoMes.format(mes))}
                </span>
                <Link href={link(somarMes(mes, 1))} aria-label="Próxima fatura" className={buttonVariants({ variant: "ghost", size: "icon-sm" })}>
                  <ChevronRight className="size-4" />
                </Link>
              </div>
              {chaveDoMes(mes) !== chaveDoMes(mesAtual) && (
                <Link href={link(mesAtual)} className="text-xs font-medium text-muted-foreground hover:text-foreground">
                  Ir para a fatura atual
                </Link>
              )}
            </div>

            <div className="flex flex-wrap items-end justify-between gap-4">
              <div className="flex flex-col gap-1.5">
                <SeloStatusFatura status={fatura.status} />
                <NumeroAnimado valor={fatura.total} className="text-4xl font-semibold tracking-tight tabular-nums" />
                <p className="text-xs text-muted-foreground">
                  Compras de {formatDatePtBr(fatura.inicio)} a {formatDatePtBr(fatura.fim)} · fecha{" "}
                  {formatDatePtBr(fatura.fechamento)} · vence {formatDatePtBr(fatura.vencimento)}
                  {fatura.pagaEm && ` · paga em ${new Date(fatura.pagaEm).toLocaleDateString("pt-BR")}`}
                </p>
              </div>
              {fatura.status !== "aberta" && fatura.total > 0 && (
                <BotaoPagarFatura cartaoId={cartao.id} mes={fatura.mes} paga={fatura.status === "paga"} />
              )}
            </div>
          </CardHeader>

          <CardContent>
            {fatura.lancamentos.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10 text-center text-sm text-muted-foreground">
                <ShoppingBag className="size-6" aria-hidden />
                Nenhuma compra nessa fatura.
              </div>
            ) : (
              <ul className="stagger-rows flex flex-col divide-y divide-border/70">
                {fatura.lancamentos.map((l) => {
                  const categoria = corPorCategoria.get(l.categoria);
                  const Icone = iconeDaCategoria(categoria?.icone ?? "outros");
                  const cor = corDaCategoria(categoria?.cor ?? "cinza");
                  return (
                    <li key={l.id} className="-mx-2 flex items-center gap-3 rounded-xl px-2 py-3 transition-colors hover:bg-muted/60">
                      <span className="w-12 shrink-0 text-xs text-muted-foreground tabular-nums">
                        {formatDatePtBr(l.dataCompra).slice(0, 5)}
                      </span>
                      <span
                        aria-hidden
                        className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-(--cor-claro)/12 text-(--cor-claro) dark:bg-(--cor-escuro)/18 dark:text-(--cor-escuro)"
                        style={{ "--cor-claro": cor.light, "--cor-escuro": cor.dark } as React.CSSProperties}
                      >
                        <Icone className="size-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="flex min-w-0 items-center gap-2 text-sm font-medium">
                          <span className="truncate">{l.descricao || l.categoria}</span>
                          {l.parcelaTotal && (
                            <span className="shrink-0 rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-semibold text-muted-foreground tabular-nums">
                              {l.parcelaNumero}/{l.parcelaTotal}
                            </span>
                          )}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {l.categoria}
                          {l.autor && ` · ${primeiroNome(l.autor.nome)}`}
                        </p>
                      </div>
                      <span
                        className={cn(
                          "shrink-0 text-sm font-semibold tabular-nums",
                          l.tipo === "receita" && "text-[#008300] dark:text-[#0ca30c]",
                        )}
                      >
                        {l.tipo === "receita" ? "+" : ""}
                        {formatCurrencyBRL(l.valor)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
