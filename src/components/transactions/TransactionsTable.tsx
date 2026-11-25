"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, Download, Pencil, Trash2 } from "lucide-react";
import { corDaCategoria } from "@/lib/categorias/cores";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState } from "@/components/shared/EmptyState";
import { useCategorias } from "@/components/categorias/CategoriasProvider";
import { formatCurrencyBRL, formatDatePtBr, primeiroNome } from "@/lib/format";
import { TIPO_COLORS, corPorTema } from "@/lib/constants/chart-colors";
import { useTema } from "@/hooks/use-tema";
import { transacaoCasa } from "@/lib/busca/correspondencia";
import { TransactionFormDialog } from "./TransactionFormDialog";
import type { TransacaoResumida } from "@/lib/queries/transactions";

export interface Membro {
  id: string;
  nome: string;
}

interface Props {
  transacoes: TransacaoResumida[];
  membros: Membro[];
  /** Filtros ja aplicados ao abrir (ex.: vindo da busca global). */
  pessoaInicial?: string;
  categoriaInicial?: string;
}

type FiltroTipo = "todos" | "despesa" | "receita";
const SEM_AUTOR = "sem-autor";

const ROTULO_ORIGEM: Record<string, string> = {
  whatsapp: "WhatsApp",
  manual: "Manual",
  recorrente: "Recorrente",
};

function rotuloOrigem(origem: string): string {
  return ROTULO_ORIGEM[origem] ?? origem;
}

function exportarCsv(transacoes: TransacaoResumida[]) {
  const cabecalho = ["Data", "Data da compra", "Categoria", "Descricao", "Pessoa", "Cartao", "Parcela", "Origem", "Tipo", "Valor"];
  const linhas = transacoes.map((t) => [
    formatDatePtBr(t.data),
    formatDatePtBr(t.dataCompra ?? t.data),
    t.categoria,
    t.descricao ?? "",
    t.autor?.nome ?? "",
    t.cartao?.nome ?? "",
    t.parcelaTotal ? `${t.parcelaNumero}/${t.parcelaTotal}` : "",
    rotuloOrigem(t.origem),
    t.tipo === "receita" ? "Receita" : "Despesa",
    t.valor.toFixed(2).replace(".", ","),
  ]);

  const csv = [cabecalho, ...linhas]
    .map((linha) => linha.map((campo) => `"${String(campo).replace(/"/g, '""')}"`).join(";"))
    .join("\n");

  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `transacoes-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function TransactionsTable({ transacoes, membros, pessoaInicial, categoriaInicial }: Props) {
  const router = useRouter();
  const tema = useTema();
  const categorias = useCategorias();
  const [filtroTipo, setFiltroTipo] = useState<FiltroTipo>("todos");
  const [filtroCategoria, setFiltroCategoria] = useState<string>(categoriaInicial ?? "todas");
  const [filtroPessoa, setFiltroPessoa] = useState<string>(
    pessoaInicial && membros.some((m) => m.id === pessoaInicial) ? pessoaInicial : "todas",
  );
  const [filtroTexto, setFiltroTexto] = useState("");
  const [excluindo, setExcluindo] = useState<string | null>(null);

  const temSemAutor = transacoes.some((t) => !t.autor);
  const variasPessoas = membros.length > 1 || temSemAutor;

  const transacoesFiltradas = useMemo(() => {
    return transacoes.filter((t) => {
      if (filtroTipo !== "todos" && t.tipo !== filtroTipo) return false;
      if (filtroCategoria !== "todas" && t.categoria !== filtroCategoria) return false;
      if (filtroPessoa === SEM_AUTOR && t.autor) return false;
      if (filtroPessoa !== "todas" && filtroPessoa !== SEM_AUTOR && t.autor?.id !== filtroPessoa) return false;
      // Mesmas regras da busca global: sem acento, por valor, data ou pessoa.
      if (!transacaoCasa(t, filtroTexto)) return false;
      return true;
    });
  }, [transacoes, filtroTipo, filtroCategoria, filtroPessoa, filtroTexto]);

  const resumo = useMemo(() => {
    let entradas = 0;
    let saidas = 0;
    const saidasPorPessoa = new Map<string, number>();
    for (const t of transacoesFiltradas) {
      if (t.tipo === "receita") {
        entradas += t.valor;
      } else {
        saidas += t.valor;
        const chave = t.autor?.id ?? SEM_AUTOR;
        saidasPorPessoa.set(chave, (saidasPorPessoa.get(chave) ?? 0) + t.valor);
      }
    }
    return { entradas, saidas, total: transacoesFiltradas.length, saidasPorPessoa };
  }, [transacoesFiltradas]);

  async function excluir(id: string, todasAsParcelas: boolean) {
    setExcluindo(id);
    const res = await fetch(`/api/transactions/${id}${todasAsParcelas ? "?escopo=todas" : ""}`, { method: "DELETE" });
    setExcluindo(null);

    if (!res.ok) {
      toast.error("Não foi possível excluir a transação.");
      return;
    }

    toast.success(todasAsParcelas ? "Compra parcelada excluída." : "Transação excluída.");
    router.refresh();
  }

  const corReceita = corPorTema(TIPO_COLORS.receita, tema);
  const corDespesa = corPorTema(TIPO_COLORS.despesa, tema);

  const pessoasComGasto = [
    ...membros.map((m) => ({ id: m.id, nome: primeiroNome(m.nome) })),
    ...(temSemAutor ? [{ id: SEM_AUTOR, nome: "Sem autor" }] : []),
  ].filter((p) => (resumo.saidasPorPessoa.get(p.id) ?? 0) > 0);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-wrap gap-8">
          <div>
            <p className="text-xs text-muted-foreground">Total de transações</p>
            <p className="text-xl font-semibold tabular-nums">{resumo.total}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Entradas</p>
            <p className="text-xl font-semibold tabular-nums" style={{ color: corReceita }}>
              {formatCurrencyBRL(resumo.entradas)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Saídas</p>
            <p className="text-xl font-semibold tabular-nums" style={{ color: corDespesa }}>
              {formatCurrencyBRL(resumo.saidas)}
            </p>
          </div>
          {variasPessoas && pessoasComGasto.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground">Saídas por pessoa</p>
              <p className="flex flex-wrap gap-x-3 text-sm tabular-nums">
                {pessoasComGasto.map((p) => (
                  <span key={p.id}>
                    <span className="text-muted-foreground">{p.nome}</span>{" "}
                    <span className="font-medium">{formatCurrencyBRL(resumo.saidasPorPessoa.get(p.id) ?? 0)}</span>
                  </span>
                ))}
              </p>
            </div>
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => exportarCsv(transacoesFiltradas)}
          disabled={transacoesFiltradas.length === 0}
        >
          <Download className="size-4" />
          Exportar CSV
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Input
          value={filtroTexto}
          onChange={(e) => setFiltroTexto(e.target.value)}
          placeholder="Filtrar: descrição, valor, data, pessoa…"
          aria-label="Filtrar transações"
          className="w-56 rounded-full"
        />

        <Select value={filtroTipo} onValueChange={(v) => v && setFiltroTipo(v as FiltroTipo)}>
          <SelectTrigger className="w-36 rounded-full">
            <SelectValue>
              {(valor: string) => (valor === "despesa" ? "Despesa" : valor === "receita" ? "Receita" : "Todos os tipos")}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os tipos</SelectItem>
            <SelectItem value="despesa">Despesa</SelectItem>
            <SelectItem value="receita">Receita</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filtroCategoria} onValueChange={(v) => v && setFiltroCategoria(v)}>
          <SelectTrigger className="w-44 rounded-full">
            <SelectValue>{(valor: string) => (valor === "todas" ? "Todas as categorias" : valor)}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas as categorias</SelectItem>
            {categorias.lista.map((c) => (
              <SelectItem key={c.id} value={c.nome}>
                {c.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {variasPessoas && (
          <Select value={filtroPessoa} onValueChange={(v) => v && setFiltroPessoa(v)}>
            <SelectTrigger className="w-40 rounded-full">
              <SelectValue>
                {(valor: string) =>
                  valor === "todas"
                    ? "Todas as pessoas"
                    : valor === SEM_AUTOR
                      ? "Sem autor"
                      : primeiroNome(membros.find((m) => m.id === valor)?.nome ?? "")
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas as pessoas</SelectItem>
              {membros.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.nome}
                </SelectItem>
              ))}
              {temSemAutor && <SelectItem value={SEM_AUTOR}>Sem autor</SelectItem>}
            </SelectContent>
          </Select>
        )}
      </div>

      {transacoesFiltradas.length === 0 ? (
        <EmptyState message="Nenhuma transação encontrada com esses filtros." />
      ) : (
        <ul className="stagger-rows flex flex-col divide-y divide-border/70">
          {transacoesFiltradas.map((t) => {
            const Icone = categorias.icone(t.categoria);
            const corTipo = t.tipo === "receita" ? corReceita : corDespesa;

            return (
              <li key={t.id} className="group/linha -mx-2 rounded-xl px-2 transition-colors duration-200 hover:bg-muted/60 flex items-center gap-3 py-3">
                <span
                  className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-(--cor-claro)/12 text-(--cor-claro) transition-transform duration-300 ease-out group-hover/linha:scale-105 dark:bg-(--cor-escuro)/18 dark:text-(--cor-escuro)"
                  style={{ "--cor-claro": categorias.cor(t.categoria).light, "--cor-escuro": categorias.cor(t.categoria).dark } as React.CSSProperties}
                >
                  <Icone className="size-[1.1rem]" aria-hidden />
                </span>

                <div className="min-w-0 flex-1">
                  <p className="flex min-w-0 items-center gap-2 text-sm font-medium">
                    <span className="truncate">{t.descricao || t.categoria}</span>
                    {t.parcelaTotal && (
                      <span className="shrink-0 rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-semibold text-muted-foreground tabular-nums">
                        {t.parcelaNumero}/{t.parcelaTotal}
                      </span>
                    )}
                  </p>
                  <p className="flex min-w-0 items-center gap-1 truncate text-xs text-muted-foreground">
                    {t.cartao && (
                      <span
                        className="inline-flex shrink-0 items-center gap-1 font-medium text-(--cor-claro) dark:text-(--cor-escuro)"
                        style={{ "--cor-claro": corDaCategoria(t.cartao.cor).light, "--cor-escuro": corDaCategoria(t.cartao.cor).dark } as React.CSSProperties}
                      >
                        <CreditCard className="size-3" aria-hidden />
                        {t.cartao.nome} ·
                      </span>
                    )}
                    <span className="truncate">
                      {t.categoria}
                      {t.autor && ` · ${primeiroNome(t.autor.nome)}`}
                    </span>
                  </p>
                </div>

                <span className="hidden shrink-0 text-xs text-muted-foreground sm:block">{rotuloOrigem(t.origem)}</span>

                <span
                  className="hidden shrink-0 rounded-full px-2.5 py-1 text-xs font-medium sm:inline-block"
                  style={{ backgroundColor: `color-mix(in oklch, ${corTipo} 15%, transparent)`, color: corTipo }}
                >
                  {t.tipo === "receita" ? "Receita" : "Despesa"}
                </span>

                <span className="w-24 shrink-0 text-right text-sm font-semibold tabular-nums">
                  {t.tipo === "despesa" ? "-" : "+"}
                  {formatCurrencyBRL(t.valor)}
                </span>

                <span
                  className="hidden w-20 shrink-0 text-right text-xs text-muted-foreground md:block"
                  title={t.dataCompra ? `Compra em ${formatDatePtBr(t.dataCompra)}; conta no vencimento da fatura` : undefined}
                >
                  {formatDatePtBr(t.data)}
                </span>

                <div className="flex shrink-0 items-center gap-1">
                  <TransactionFormDialog
                    transacao={t}
                    trigger={
                      <Button variant="ghost" size="icon-sm" aria-label="Editar">
                        <Pencil className="size-3.5" />
                      </Button>
                    }
                  />

                  <AlertDialog>
                    <AlertDialogTrigger
                      render={
                        <Button variant="ghost" size="icon-sm" aria-label="Excluir">
                          <Trash2 className="size-3.5" />
                        </Button>
                      }
                    />
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          {t.parcelaTotal ? "Excluir compra parcelada?" : "Excluir transação?"}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          {t.parcelaTotal
                            ? `Essa é a parcela ${t.parcelaNumero} de ${t.parcelaTotal} (${formatCurrencyBRL(t.valor)}). Você pode excluir só ela ou a compra inteira.`
                            : `Essa ação não pode ser desfeita. A transação de ${formatCurrencyBRL(t.valor)} em ${t.categoria} será excluída permanentemente.`}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        {t.parcelaTotal ? (
                          <>
                            <AlertDialogAction
                              variant="outline"
                              disabled={excluindo === t.id}
                              onClick={() => excluir(t.id, false)}
                            >
                              Só esta parcela
                            </AlertDialogAction>
                            <AlertDialogAction
                              variant="destructive"
                              disabled={excluindo === t.id}
                              onClick={() => excluir(t.id, true)}
                            >
                              Todas as {t.parcelaTotal}
                            </AlertDialogAction>
                          </>
                        ) : (
                          <AlertDialogAction
                            variant="destructive"
                            disabled={excluindo === t.id}
                            onClick={() => excluir(t.id, false)}
                          >
                            Excluir
                          </AlertDialogAction>
                        )}
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
