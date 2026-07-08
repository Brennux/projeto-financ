"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { Download, Pencil, Trash2 } from "lucide-react";
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
import { formatCurrencyBRL, formatDatePtBr } from "@/lib/format";
import { CATEGORIAS } from "@/lib/constants/categorias";
import { getCategoriaIcon } from "@/lib/constants/categoria-icons";
import { TIPO_COLORS, corPorTema } from "@/lib/constants/chart-colors";
import { TransactionFormDialog } from "./TransactionFormDialog";
import type { TransacaoResumida } from "@/lib/queries/transactions";

interface Props {
  transacoes: TransacaoResumida[];
}

type FiltroTipo = "todos" | "despesa" | "receita";

function exportarCsv(transacoes: TransacaoResumida[]) {
  const cabecalho = ["Data", "Categoria", "Descricao", "Origem", "Tipo", "Valor"];
  const linhas = transacoes.map((t) => [
    formatDatePtBr(t.data),
    t.categoria,
    t.descricao ?? "",
    t.origem === "whatsapp" ? "WhatsApp" : "Manual",
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

export function TransactionsTable({ transacoes }: Props) {
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const tema = resolvedTheme === "dark" ? "dark" : "light";
  const [filtroTipo, setFiltroTipo] = useState<FiltroTipo>("todos");
  const [filtroCategoria, setFiltroCategoria] = useState<string>("todas");
  const [filtroTexto, setFiltroTexto] = useState("");
  const [excluindo, setExcluindo] = useState<string | null>(null);

  const transacoesFiltradas = useMemo(() => {
    const texto = filtroTexto.trim().toLowerCase();
    return transacoes.filter((t) => {
      if (filtroTipo !== "todos" && t.tipo !== filtroTipo) return false;
      if (filtroCategoria !== "todas" && t.categoria !== filtroCategoria) return false;
      if (texto && !`${t.descricao ?? ""} ${t.categoria}`.toLowerCase().includes(texto)) return false;
      return true;
    });
  }, [transacoes, filtroTipo, filtroCategoria, filtroTexto]);

  const resumo = useMemo(() => {
    let entradas = 0;
    let saidas = 0;
    for (const t of transacoesFiltradas) {
      if (t.tipo === "receita") entradas += t.valor;
      else saidas += t.valor;
    }
    return { entradas, saidas, total: transacoesFiltradas.length };
  }, [transacoesFiltradas]);

  async function excluir(id: string) {
    setExcluindo(id);
    const res = await fetch(`/api/transactions/${id}`, { method: "DELETE" });
    setExcluindo(null);

    if (!res.ok) {
      toast.error("Não foi possível excluir a transação.");
      return;
    }

    toast.success("Transação excluída.");
    router.refresh();
  }

  const corReceita = corPorTema(TIPO_COLORS.receita, tema);
  const corDespesa = corPorTema(TIPO_COLORS.despesa, tema);

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
          placeholder="Buscar por descrição ou categoria..."
          className="w-56 rounded-full"
        />

        <Select value={filtroTipo} onValueChange={(v) => v && setFiltroTipo(v as FiltroTipo)}>
          <SelectTrigger className="w-36 rounded-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os tipos</SelectItem>
            <SelectItem value="despesa">Despesa</SelectItem>
            <SelectItem value="receita">Receita</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filtroCategoria} onValueChange={(v) => v && setFiltroCategoria(v)}>
          <SelectTrigger className="w-44 rounded-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas as categorias</SelectItem>
            {CATEGORIAS.map((categoria) => (
              <SelectItem key={categoria} value={categoria}>
                {categoria}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {transacoesFiltradas.length === 0 ? (
        <EmptyState message="Nenhuma transação encontrada com esses filtros." />
      ) : (
        <ul className="flex flex-col divide-y divide-border">
          {transacoesFiltradas.map((t) => {
            const Icone = getCategoriaIcon(t.categoria);
            const corTipo = t.tipo === "receita" ? corReceita : corDespesa;

            return (
              <li key={t.id} className="flex items-center gap-3 py-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-foreground">
                  <Icone className="size-[1.1rem]" aria-hidden />
                </span>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{t.descricao || t.categoria}</p>
                  <p className="truncate text-xs text-muted-foreground">{t.categoria}</p>
                </div>

                <span className="hidden shrink-0 text-xs text-muted-foreground sm:block">
                  {t.origem === "whatsapp" ? "WhatsApp" : "Manual"}
                </span>

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

                <span className="hidden w-20 shrink-0 text-right text-xs text-muted-foreground md:block">
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
                        <AlertDialogTitle>Excluir transação?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Essa ação não pode ser desfeita. A transação de {formatCurrencyBRL(t.valor)} em{" "}
                          {t.categoria} será excluída permanentemente.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          variant="destructive"
                          disabled={excluindo === t.id}
                          onClick={() => excluir(t.id)}
                        >
                          Excluir
                        </AlertDialogAction>
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
