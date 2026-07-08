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
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  manualTransactionInputSchema,
  type ManualTransactionInput,
  type ManualTransactionFormInput,
} from "@/lib/validation/transaction";
import { CATEGORIA_RULES } from "@/lib/parser/dictionaries";
import type { Categoria } from "@/lib/constants/categorias";
import type { TransacaoResumida } from "@/lib/queries/transactions";

interface Props {
  transacao?: TransacaoResumida;
  trigger: ReactElement;
}

function paraInputDate(data: Date): string {
  return data.toISOString().slice(0, 10);
}

export function TransactionFormDialog({ transacao, trigger }: Props) {
  const [aberto, setAberto] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ManualTransactionFormInput, unknown, ManualTransactionInput>({
    resolver: zodResolver(manualTransactionInputSchema),
    defaultValues: transacao
      ? {
          tipo: transacao.tipo,
          valor: transacao.valor,
          categoria: transacao.categoria as Categoria,
          descricao: transacao.descricao,
          data: transacao.data,
        }
      : {
          tipo: "despesa",
          categoria: "Outros",
          descricao: null,
          data: new Date(),
        },
  });

  const tipoSelecionado = watch("tipo");
  const categoriasDisponiveis = (Object.keys(CATEGORIA_RULES) as Categoria[]).filter((categoria) =>
    CATEGORIA_RULES[categoria].tipos.includes(tipoSelecionado),
  );

  async function onSubmit(values: ManualTransactionInput) {
    const url = transacao ? `/api/transactions/${transacao.id}` : "/api/transactions";
    const method = transacao ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    if (!res.ok) {
      toast.error("Não foi possível salvar a transação.");
      return;
    }

    toast.success(transacao ? "Transação atualizada." : "Transação adicionada.");
    setAberto(false);
    if (!transacao) reset();
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
          <DialogTitle>{transacao ? "Editar transação" : "Nova transação"}</DialogTitle>
          <DialogDescription>
            {transacao
              ? "Corrija os dados dessa transação."
              : "Adicione uma transação manualmente (sem precisar do WhatsApp)."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="tipo">Tipo</Label>
              <Controller
                control={control}
                name="tipo"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={(v) => v && field.onChange(v)}>
                    <SelectTrigger id="tipo" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="despesa">Despesa</SelectItem>
                      <SelectItem value="receita">Receita</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="valor">Valor (R$)</Label>
              <Input id="valor" type="number" step="0.01" min="0" {...register("valor", { valueAsNumber: true })} />
              {errors.valor && <p className="text-xs text-destructive">{errors.valor.message}</p>}
            </div>
          </div>

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

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="data">Data</Label>
            <Controller
              control={control}
              name="data"
              render={({ field }) => (
                <Input
                  id="data"
                  type="date"
                  value={paraInputDate(field.value as Date)}
                  onChange={(e) => field.onChange(new Date(`${e.target.value}T00:00:00`))}
                />
              )}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="descricao">Descrição (opcional)</Label>
            <Textarea id="descricao" rows={2} {...register("descricao")} />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {transacao ? "Salvar alterações" : "Adicionar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
