"use client";

import { useState, useTransition, type ReactElement } from "react";
import { Check } from "lucide-react";
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
import { salvarCartao } from "@/app/actions/cartoes";
import { CHAVES_COR, CORES_CATEGORIA, CORES_CATEGORIA_ROTULO, type CorCategoria } from "@/lib/categorias/cores";
import type { CartaoInfo } from "@/lib/cartoes/server";
import { cn } from "@/lib/utils";
import { CartaoVisual } from "./CartaoVisual";

interface Props {
  cartao?: CartaoInfo;
  trigger: ReactElement;
}

export function CartaoFormDialog({ cartao, trigger }: Props) {
  const [aberto, setAberto] = useState(false);
  const [salvando, iniciarSalvamento] = useTransition();
  const [nome, setNome] = useState(cartao?.nome ?? "");
  const [cor, setCor] = useState<CorCategoria>((cartao?.cor as CorCategoria) ?? "violeta");
  const [limite, setLimite] = useState(cartao?.limite ? String(cartao.limite) : "");
  const [fechamento, setFechamento] = useState(cartao ? String(cartao.diaFechamento) : "");
  const [vencimento, setVencimento] = useState(cartao ? String(cartao.diaVencimento) : "");

  function restaurar() {
    setNome(cartao?.nome ?? "");
    setCor((cartao?.cor as CorCategoria) ?? "violeta");
    setLimite(cartao?.limite ? String(cartao.limite) : "");
    setFechamento(cartao ? String(cartao.diaFechamento) : "");
    setVencimento(cartao ? String(cartao.diaVencimento) : "");
  }

  function salvar(e: React.FormEvent) {
    e.preventDefault();
    iniciarSalvamento(async () => {
      const resultado = await salvarCartao(cartao?.id ?? null, {
        nome,
        cor,
        limite: limite.trim() ? Number(limite.replace(",", ".")) : null,
        diaFechamento: Number(fechamento),
        diaVencimento: Number(vencimento),
      });
      if (!resultado.ok) {
        toast.error(resultado.erro);
        return;
      }
      toast.success(cartao ? "Cartão atualizado." : "Cartão cadastrado.");
      setAberto(false);
      if (!cartao) restaurar();
    });
  }

  return (
    <Dialog
      open={aberto}
      onOpenChange={(valor) => {
        setAberto(valor);
        if (!valor) restaurar();
      }}
    >
      <DialogTrigger render={trigger} />
      <DialogContent className="max-h-[92dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{cartao ? "Editar cartão" : "Novo cartão"}</DialogTitle>
          <DialogDescription>
            O fechamento decide em que fatura cada compra cai; o vencimento é o mês em que ela conta.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={salvar} className="flex flex-col gap-5">
          <CartaoVisual
            nome={nome.trim() || "Seu cartão"}
            cor={cor}
            rodape={fechamento && vencimento ? `fecha dia ${fechamento} · vence dia ${vencimento}` : "fechamento e vencimento"}
            className="mx-auto max-w-80"
          />

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cartao-nome">Nome</Label>
            <Input
              id="cartao-nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex.: Nubank, Itaú, Inter"
              maxLength={30}
              required
            />
          </div>

          <fieldset className="flex flex-col gap-1.5">
            <legend className="mb-1.5 text-sm font-medium">Cor</legend>
            <div className="flex flex-wrap gap-2" role="radiogroup">
              {CHAVES_COR.map((chave) => (
                <button
                  key={chave}
                  type="button"
                  role="radio"
                  aria-checked={cor === chave}
                  aria-label={CORES_CATEGORIA_ROTULO[chave]}
                  title={CORES_CATEGORIA_ROTULO[chave]}
                  onClick={() => setCor(chave)}
                  className={cn(
                    "flex size-8 cursor-pointer items-center justify-center rounded-full text-white ring-offset-2 ring-offset-background transition-transform hover:scale-110",
                    cor === chave && "ring-2 ring-foreground",
                  )}
                  style={{ backgroundColor: CORES_CATEGORIA[chave].light }}
                >
                  {cor === chave && <Check className="size-4" />}
                </button>
              ))}
            </div>
          </fieldset>

          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cartao-fechamento">Fecha dia</Label>
              <Input
                id="cartao-fechamento"
                type="number"
                min={1}
                max={31}
                value={fechamento}
                onChange={(e) => setFechamento(e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cartao-vencimento">Vence dia</Label>
              <Input
                id="cartao-vencimento"
                type="number"
                min={1}
                max={31}
                value={vencimento}
                onChange={(e) => setVencimento(e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cartao-limite">Limite (R$)</Label>
              <Input
                id="cartao-limite"
                type="number"
                step="0.01"
                min="0"
                value={limite}
                onChange={(e) => setLimite(e.target.value)}
                placeholder="Opcional"
              />
            </div>
          </div>
          <p className="-mt-2 text-xs text-muted-foreground">
            Dica: o fechamento costuma ser uns 7 dias antes do vencimento. No app do banco ele aparece como
            &quot;melhor dia de compra&quot;.
          </p>

          <DialogFooter>
            <Button type="submit" disabled={salvando}>
              {salvando ? "Salvando..." : cartao ? "Salvar alterações" : "Cadastrar cartão"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
