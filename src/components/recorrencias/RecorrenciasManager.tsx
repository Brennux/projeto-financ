"use client";

import { useState } from "react";
import { Pause, Pencil, Play, Plus, Trash2 } from "lucide-react";
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
import { EmptyState } from "@/components/shared/EmptyState";
import { useCategorias } from "@/components/categorias/CategoriasProvider";
import { alternarRecorrencia, excluirRecorrencia } from "@/app/actions/recorrencias";
import { TIPO_COLORS, corPorTema } from "@/lib/constants/chart-colors";
import { formatCurrencyBRL, formatDatePtBr, primeiroNome } from "@/lib/format";
import { useTema } from "@/hooks/use-tema";
import { cn } from "@/lib/utils";
import { RecorrenciaFormDialog, type RecorrenciaResumida } from "./RecorrenciaFormDialog";

interface Props {
  recorrencias: RecorrenciaResumida[];
  /** Abre o formulario de novo recorrente ja de cara (?novo=1, vindo da busca global). */
  abrirNovo?: boolean;
}

export function RecorrenciasManager({ recorrencias, abrirNovo = false }: Props) {
  const tema = useTema();
  const categorias = useCategorias();
  const [ocupado, setOcupado] = useState<string | null>(null);

  const ativas = recorrencias.filter((r) => r.ativo);
  const despesasMensais = ativas.filter((r) => r.tipo === "despesa").reduce((s, r) => s + r.valor, 0);
  const receitasMensais = ativas.filter((r) => r.tipo === "receita").reduce((s, r) => s + r.valor, 0);
  const corReceita = corPorTema(TIPO_COLORS.receita, tema);
  const corDespesa = corPorTema(TIPO_COLORS.despesa, tema);

  async function executar(id: string, acao: () => Promise<{ ok: true } | { ok: false; erro: string }>, sucesso: string) {
    setOcupado(id);
    const resultado = await acao();
    setOcupado(null);
    if (!resultado.ok) toast.error(resultado.erro);
    else toast.success(sucesso);
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-wrap gap-8">
          <div>
            <p className="text-xs text-muted-foreground">Entradas fixas por mês</p>
            <p className="text-xl font-semibold tabular-nums" style={{ color: corReceita }}>
              {formatCurrencyBRL(receitasMensais)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Saídas fixas por mês</p>
            <p className="text-xl font-semibold tabular-nums" style={{ color: corDespesa }}>
              {formatCurrencyBRL(despesasMensais)}
            </p>
          </div>
        </div>
        <RecorrenciaFormDialog
          key={abrirNovo ? "novo" : "padrao"}
          abertoInicial={abrirNovo}
          trigger={
            <Button>
              <Plus className="size-4" />
              Novo recorrente
            </Button>
          }
        />
      </div>

      {recorrencias.length === 0 ? (
        <EmptyState message="Nenhum lançamento recorrente ainda. Cadastre aluguel, salário, assinaturas e o app lança sozinho todo mês." />
      ) : (
        <ul className="stagger-rows flex flex-col divide-y divide-border/70">
          {recorrencias.map((r) => {
            const Icone = categorias.icone(r.categoria);
            const corTipo = r.tipo === "receita" ? corReceita : corDespesa;

            return (
              <li key={r.id} className={cn("-mx-2 rounded-xl px-2 transition-colors duration-200 hover:bg-muted/60 flex items-center gap-3 py-3", !r.ativo && "opacity-60")}>
                <span
                  className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-(--cor-claro)/12 text-(--cor-claro) dark:bg-(--cor-escuro)/18 dark:text-(--cor-escuro)"
                  style={{ "--cor-claro": categorias.cor(r.categoria).light, "--cor-escuro": categorias.cor(r.categoria).dark } as React.CSSProperties}
                >
                  <Icone className="size-[1.1rem]" aria-hidden />
                </span>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{r.descricao}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {r.categoria} · todo dia {r.diaDoMes}
                    {r.autor && ` · ${primeiroNome(r.autor)}`}
                    {" · "}
                    {r.ativo ? `próximo em ${formatDatePtBr(r.proximaData)}` : "pausado"}
                  </p>
                </div>

                <span className="w-24 shrink-0 text-right text-sm font-semibold tabular-nums" style={{ color: corTipo }}>
                  {r.tipo === "despesa" ? "-" : "+"}
                  {formatCurrencyBRL(r.valor)}
                </span>

                <div className="flex shrink-0 items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={r.ativo ? `Pausar ${r.descricao}` : `Retomar ${r.descricao}`}
                    title={r.ativo ? "Pausar" : "Retomar"}
                    disabled={ocupado === r.id}
                    onClick={() =>
                      executar(
                        r.id,
                        () => alternarRecorrencia(r.id, !r.ativo),
                        r.ativo ? "Lançamento pausado." : "Lançamento retomado.",
                      )
                    }
                  >
                    {r.ativo ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
                  </Button>

                  <RecorrenciaFormDialog
                    recorrencia={r}
                    trigger={
                      <Button variant="ghost" size="icon-sm" aria-label={`Editar ${r.descricao}`}>
                        <Pencil className="size-3.5" />
                      </Button>
                    }
                  />

                  <AlertDialog>
                    <AlertDialogTrigger
                      render={
                        <Button variant="ghost" size="icon-sm" aria-label={`Excluir ${r.descricao}`}>
                          <Trash2 className="size-3.5" />
                        </Button>
                      }
                    />
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Excluir &quot;{r.descricao}&quot;?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Ele para de ser lançado nos próximos meses. Os lançamentos que já foram feitos continuam
                          nas transações.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          variant="destructive"
                          disabled={ocupado === r.id}
                          onClick={() => executar(r.id, () => excluirRecorrencia(r.id), "Lançamento recorrente excluído.")}
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
