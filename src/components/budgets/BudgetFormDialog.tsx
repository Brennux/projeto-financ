"use client";

import { useState, type ReactElement } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  budgetInputSchema,
  type BudgetFormInput,
  type BudgetInput,
} from "@/lib/validation/budget";
import type { Categoria } from "@/lib/constants/categorias";
import type { Orcamento } from "@/lib/queries/budgets";

interface Props {
  orcamento?: Orcamento;
  categoriasDisponiveis?: Categoria[];
  trigger: ReactElement;
}

export function BudgetFormDialog({ orcamento, categoriasDisponiveis = [], trigger }: Props) {
  const [aberto, setAberto] = useState(false);
  const router = useRouter();
  const editando = Boolean(orcamento);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<BudgetFormInput, unknown, BudgetInput>({
    resolver: zodResolver(budgetInputSchema),
    defaultValues: orcamento
      ? { categoria: orcamento.categoria, limite: orcamento.limite }
      : { categoria: categoriasDisponiveis[0], limite: undefined },
  });

  async function onSubmit(values: BudgetInput) {
    const url = orcamento ? `/api/budgets/${orcamento.id}` : "/api/budgets";
    const method = orcamento ? "PATCH" : "POST";
    const body = editando ? { limite: values.limite } : values;

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      toast.error("Não foi possível salvar o orçamento.");
      return;
    }

    toast.success(orcamento ? "Orçamento atualizado." : "Orçamento definido.");
    setAberto(false);
    if (!orcamento) reset();
    router.refresh();
  }

  return (
    <Dialog
      open={aberto}
      onOpenChange={(valor) => {
        setAberto(valor);
        if (!valor) reset();
      }}
    >
      <DialogTrigger render={trigger} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{orcamento ? "Editar orçamento" : "Definir orçamento"}</DialogTitle>
          <DialogDescription>
            {orcamento
              ? `Ajuste o limite mensal para ${orcamento.categoria}.`
              : "Defina um limite mensal para uma categoria de despesa."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          {editando ? (
            <div className="flex flex-col gap-1.5">
              <Label>Categoria</Label>
              <p className="text-sm text-muted-foreground">{orcamento?.categoria}</p>
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="categoria">Categoria</Label>
              <Controller
                control={control}
                name="categoria"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={(v) => v && field.onChange(v)}>
                    <SelectTrigger id="categoria" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categoriasDisponiveis.map((categoria) => (
                        <SelectItem key={categoria} value={categoria}>
                          {categoria}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="limite">Limite mensal (R$)</Label>
            <Input id="limite" type="number" step="0.01" min="0" {...register("limite", { valueAsNumber: true })} />
            {errors.limite && <p className="text-xs text-destructive">{errors.limite.message}</p>}
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {orcamento ? "Salvar alterações" : "Definir orçamento"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
