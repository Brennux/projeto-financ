"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, Plus } from "lucide-react";
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
import { formatCurrencyBRL } from "@/lib/format";
import { BudgetFormDialog } from "./BudgetFormDialog";
import { BudgetProgressList } from "./BudgetProgressList";
import type { Categoria } from "@/lib/constants/categorias";
import type { OrcamentoComGasto } from "@/lib/queries/budgets";

interface Props {
  orcamentos: OrcamentoComGasto[];
  categoriasSemOrcamento: Categoria[];
}

export function BudgetsManager({ orcamentos, categoriasSemOrcamento }: Props) {
  const router = useRouter();
  const [excluindo, setExcluindo] = useState<string | null>(null);

  async function excluir(id: string) {
    setExcluindo(id);
    const res = await fetch(`/api/budgets/${id}`, { method: "DELETE" });
    setExcluindo(null);

    if (!res.ok) {
      toast.error("Não foi possível excluir o orçamento.");
      return;
    }

    toast.success("Orçamento excluído.");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      {orcamentos.length === 0 ? (
        <EmptyState message="Nenhum orçamento definido ainda." />
      ) : (
        <BudgetProgressList
          orcamentos={orcamentos}
          renderActions={(o) => (
            <div className="flex items-center gap-1">
              <BudgetFormDialog
                orcamento={o}
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
                    <AlertDialogTitle>Excluir orçamento?</AlertDialogTitle>
                    <AlertDialogDescription>
                      O limite de {formatCurrencyBRL(o.limite)} para {o.categoria} será removido.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      variant="destructive"
                      disabled={excluindo === o.id}
                      onClick={() => excluir(o.id)}
                    >
                      Excluir
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        />
      )}

      {categoriasSemOrcamento.length > 0 && (
        <div className="flex flex-col gap-2 border-t pt-4">
          <p className="text-sm text-muted-foreground">Categorias sem limite definido</p>
          <div className="flex flex-wrap gap-2">
            {categoriasSemOrcamento.map((categoria) => (
              <BudgetFormDialog
                key={categoria}
                categoriasDisponiveis={[categoria]}
                trigger={
                  <Button variant="outline" size="sm">
                    <Plus className="size-3.5" />
                    {categoria}
                  </Button>
                }
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
