"use client";

import { useState, useTransition, type ReactElement } from "react";
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
import { salvarRecorrencia } from "@/app/actions/recorrencias";
import { useCategorias } from "@/components/categorias/CategoriasProvider";
import { CATEGORIA_FALLBACK } from "@/lib/categorias/padrao";
import type { Tipo } from "@/lib/parser/types";

export interface RecorrenciaResumida {
  id: string;
  tipo: Tipo;
  valor: number;
  categoria: string;
  descricao: string;
  diaDoMes: number;
  proximaData: Date;
  ativo: boolean;
  autor: string | null;
}

interface Props {
  recorrencia?: RecorrenciaResumida;
  trigger: ReactElement;
  /** Ja abre aberto (ex.: escolhido na busca global, via ?novo=1). */
  abertoInicial?: boolean;
}

/** Tira o ?novo=1 da URL ao fechar -- senao recarregar reabriria o formulario. */
function limparParametroNovo() {
  const url = new URL(window.location.href);
  if (!url.searchParams.has("novo")) return;
  url.searchParams.delete("novo");
  window.history.replaceState(window.history.state, "", url.pathname + url.search);
}

export function RecorrenciaFormDialog({ recorrencia, trigger, abertoInicial = false }: Props) {
  const categorias = useCategorias();
  const [aberto, setAberto] = useState(abertoInicial);
  const [salvando, iniciarSalvamento] = useTransition();

  const [tipo, setTipo] = useState<Tipo>(recorrencia?.tipo ?? "despesa");
  const [valor, setValor] = useState(recorrencia ? String(recorrencia.valor) : "");
  const [categoria, setCategoria] = useState(recorrencia?.categoria ?? CATEGORIA_FALLBACK);
  const [descricao, setDescricao] = useState(recorrencia?.descricao ?? "");
  const [dia, setDia] = useState(recorrencia ? String(recorrencia.diaDoMes) : "");

  function restaurar() {
    setTipo(recorrencia?.tipo ?? "despesa");
    setValor(recorrencia ? String(recorrencia.valor) : "");
    setCategoria(recorrencia?.categoria ?? CATEGORIA_FALLBACK);
    setDescricao(recorrencia?.descricao ?? "");
    setDia(recorrencia ? String(recorrencia.diaDoMes) : "");
  }

  function trocarTipo(novo: Tipo) {
    setTipo(novo);
    if (!categorias.doTipo(novo).some((c) => c.nome === categoria)) setCategoria(CATEGORIA_FALLBACK);
  }

  function salvar(e: React.FormEvent) {
    e.preventDefault();
    iniciarSalvamento(async () => {
      const resultado = await salvarRecorrencia(recorrencia?.id ?? null, {
        tipo,
        valor: Number(valor.replace(",", ".")),
        categoria,
        descricao,
        diaDoMes: Number(dia),
      });
      if (!resultado.ok) {
        toast.error(resultado.erro);
        return;
      }
      toast.success(recorrencia ? "Lançamento recorrente atualizado." : "Lançamento recorrente criado.");
      setAberto(false);
      if (!recorrencia) restaurar();
      limparParametroNovo();
    });
  }

  return (
    <Dialog
      open={aberto}
      onOpenChange={(valor) => {
        setAberto(valor);
        if (!valor) {
          restaurar();
          limparParametroNovo();
        }
      }}
    >
      <DialogTrigger render={trigger} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{recorrencia ? "Editar lançamento recorrente" : "Novo lançamento recorrente"}</DialogTitle>
          <DialogDescription>
            Lançado automaticamente todo mês no dia escolhido. Se o dia já passou neste mês, começa no mês que vem.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={salvar} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="rec-descricao">Descrição</Label>
            <Input
              id="rec-descricao"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Ex.: Aluguel, Salário, Netflix"
              maxLength={80}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="rec-tipo">Tipo</Label>
              <Select value={tipo} onValueChange={(v) => v && trocarTipo(v as Tipo)}>
                <SelectTrigger id="rec-tipo" className="w-full">
                  <SelectValue>{(v: string) => (v === "receita" ? "Receita" : "Despesa")}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="despesa">Despesa</SelectItem>
                  <SelectItem value="receita">Receita</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="rec-valor">Valor (R$)</Label>
              <Input
                id="rec-valor"
                type="number"
                step="0.01"
                min="0.01"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-[1fr_7rem] gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="rec-categoria">Categoria</Label>
              <Select value={categoria} onValueChange={(v) => v && setCategoria(v)}>
                <SelectTrigger id="rec-categoria" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categorias.doTipo(tipo).map((c) => (
                    <SelectItem key={c.id} value={c.nome}>
                      {c.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="rec-dia">Todo dia</Label>
              <Input
                id="rec-dia"
                type="number"
                min={1}
                max={31}
                value={dia}
                onChange={(e) => setDia(e.target.value)}
                placeholder="1 a 31"
                required
              />
            </div>
          </div>
          {Number(dia) > 28 && (
            <p className="-mt-2 text-xs text-muted-foreground">
              Em meses mais curtos, é lançado no último dia do mês.
            </p>
          )}

          <DialogFooter>
            <Button type="submit" disabled={salvando}>
              {salvando ? "Salvando..." : recorrencia ? "Salvar alterações" : "Criar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
