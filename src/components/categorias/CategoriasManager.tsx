"use client";

import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { excluirCategoriaAction } from "@/app/actions/categorias";
import { corDaCategoria } from "@/lib/categorias/cores";
import { iconeDaCategoria } from "@/lib/categorias/icones";
import { CATEGORIA_FALLBACK } from "@/lib/categorias/padrao";
import type { CategoriaInfo } from "@/lib/categorias/types";
import { CategoriaFormDialog } from "./CategoriaFormDialog";

interface Props {
  categorias: CategoriaInfo[];
  /** Quantidade de transacoes por nome de categoria. */
  uso: Record<string, number>;
}

function pluralTransacoes(n: number): string {
  return n === 1 ? "1 transação" : `${n} transações`;
}

export function CategoriasManager({ categorias, uso }: Props) {
  const [excluindo, setExcluindo] = useState<string | null>(null);

  async function excluir(categoria: CategoriaInfo) {
    setExcluindo(categoria.id);
    const resultado = await excluirCategoriaAction(categoria.id);
    setExcluindo(null);
    if (!resultado.ok) {
      toast.error(resultado.erro);
      return;
    }
    toast.success(`Categoria ${categoria.nome} excluída.`);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <CategoriaFormDialog
          trigger={
            <Button>
              <Plus className="size-4" />
              Nova categoria
            </Button>
          }
        />
      </div>

      <ul className="stagger-rows flex flex-col divide-y divide-border/70">
        {categorias.map((c) => {
          const Icone = iconeDaCategoria(c.icone);
          const cor = corDaCategoria(c.cor);
          const qtd = uso[c.nome] ?? 0;

          return (
            <li key={c.id} className="-mx-2 rounded-xl px-2 transition-colors duration-200 hover:bg-muted/60 flex items-center gap-3 py-3">
              <span
                className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-(--cor-claro)/15 text-(--cor-claro) dark:bg-(--cor-escuro)/20 dark:text-(--cor-escuro)"
                style={{ "--cor-claro": cor.light, "--cor-escuro": cor.dark } as React.CSSProperties}
                aria-hidden
              >
                <Icone className="size-[1.1rem]" />
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-sm font-medium">{c.nome}</span>
                  {c.tipos.map((t) => (
                    <Badge key={t} variant="outline">
                      {t === "despesa" ? "Despesa" : "Receita"}
                    </Badge>
                  ))}
                </div>
                <p className="truncate text-xs text-muted-foreground">
                  {c.palavrasChave.length > 0
                    ? c.palavrasChave.join(", ")
                    : c.sistema
                      ? "Usada quando nenhuma outra categoria combina com a mensagem"
                      : "Sem palavras-chave: o bot só reconhece pelo nome"}
                </p>
              </div>

              <span className="hidden shrink-0 text-xs text-muted-foreground sm:block">{pluralTransacoes(qtd)}</span>

              <div className="flex shrink-0 items-center gap-1">
                <CategoriaFormDialog
                  categoria={c}
                  trigger={
                    <Button variant="ghost" size="icon-sm" aria-label={`Editar ${c.nome}`}>
                      <Pencil className="size-3.5" />
                    </Button>
                  }
                />
                {!c.sistema && (
                  <AlertDialog>
                    <AlertDialogTrigger
                      render={
                        <Button variant="ghost" size="icon-sm" aria-label={`Excluir ${c.nome}`}>
                          <Trash2 className="size-3.5" />
                        </Button>
                      }
                    />
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Excluir a categoria {c.nome}?</AlertDialogTitle>
                        <AlertDialogDescription>
                          {qtd > 0
                            ? `As ${pluralTransacoes(qtd)} dela passam para ${CATEGORIA_FALLBACK}. `
                            : ""}
                          O orçamento dessa categoria, se houver, é removido.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction variant="destructive" disabled={excluindo === c.id} onClick={() => excluir(c)}>
                          Excluir
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
