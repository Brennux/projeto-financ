"use client";

import { useState, type ReactElement } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CreditCard, Info, Wallet } from "lucide-react";
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
import { CATEGORIA_FALLBACK } from "@/lib/categorias/padrao";
import { corDaCategoria } from "@/lib/categorias/cores";
import { dividirEmParcelas, gerarParcelas, mesDaFatura, vencimentoDaFatura } from "@/lib/cartoes/fatura";
import { formatCurrencyBRL, formatDatePtBr } from "@/lib/format";
import { useCategorias } from "@/components/categorias/CategoriasProvider";
import { useCartoes } from "@/components/cartoes/CartoesProvider";
import type { TransacaoResumida } from "@/lib/queries/transactions";

interface Props {
  transacao?: TransacaoResumida;
  trigger: ReactElement;
  /** Ja abre aberto (ex.: "Nova transação" escolhida na busca global, via ?nova=1). */
  abertoInicial?: boolean;
}

/** Sem cartao = dinheiro, debito ou Pix (sai na hora). */
const SEM_CARTAO = "sem-cartao";
const OPCOES_PARCELAS = Array.from({ length: 24 }, (_, i) => i + 1);

/** Tira o ?nova=1 da URL ao fechar -- senao recarregar a pagina reabriria o formulario. */
function limparParametroNova(router: ReturnType<typeof useRouter>) {
  const url = new URL(window.location.href);
  if (!url.searchParams.has("nova")) return;
  url.searchParams.delete("nova");
  router.replace(url.pathname + url.search, { scroll: false });
}

function paraInputDate(data: Date): string {
  return data.toISOString().slice(0, 10);
}

/** "dezembro" (ou "dez/27" quando o ano nao e o atual). */
function nomeDoMesDaFatura(mes: Date): string {
  const mesmoAno = mes.getUTCFullYear() === new Date().getFullYear();
  const local = new Date(mes.getUTCFullYear(), mes.getUTCMonth(), 1);
  return format(local, mesmoAno ? "MMMM" : "MMM/yy", { locale: ptBR });
}

export function TransactionFormDialog({ transacao, trigger, abertoInicial = false }: Props) {
  const [aberto, setAberto] = useState(abertoInicial);
  const [aplicarATodas, setAplicarATodas] = useState(false);
  const router = useRouter();
  const categorias = useCategorias();
  const cartoes = useCartoes();
  const editandoParcela = Boolean(transacao?.parcelamentoId);
  const editandoNoCartao = Boolean(transacao?.cartao);

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    getValues,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ManualTransactionFormInput, unknown, ManualTransactionInput>({
    resolver: zodResolver(manualTransactionInputSchema),
    defaultValues: transacao
      ? {
          tipo: transacao.tipo,
          valor: transacao.valor,
          categoria: transacao.categoria,
          descricao: transacao.descricao,
          data: transacao.data,
        }
      : {
          tipo: "despesa",
          categoria: CATEGORIA_FALLBACK,
          descricao: null,
          data: new Date(),
          cartaoId: null,
          parcelas: 1,
        },
  });

  const tipoSelecionado = watch("tipo");
  const cartaoId = watch("cartaoId");
  const parcelas = Number(watch("parcelas") ?? 1);
  const valor = Number(watch("valor"));
  const dataCompra = watch("data") as Date | undefined;
  const categoriasDisponiveis = categorias.doTipo(tipoSelecionado).map((c) => c.nome);
  const cartao = cartoes.find((c) => c.id === cartaoId) ?? null;
  const ehDespesa = tipoSelecionado === "despesa";

  // Previa do que vai acontecer: valor de cada parcela e em que fatura/mes cai.
  let previa: string | null = null;
  if (!transacao && ehDespesa && dataCompra instanceof Date && !Number.isNaN(dataCompra.getTime())) {
    const valido = Number.isFinite(valor) && valor > 0;
    if (cartao) {
      const mes = mesDaFatura(dataCompra, cartao);
      const quando = `fatura de ${nomeDoMesDaFatura(mes)} (vence ${formatDatePtBr(vencimentoDaFatura(mes, cartao))})`;
      previa =
        parcelas > 1
          ? `${valido ? `${parcelas}x de ${formatCurrencyBRL(dividirEmParcelas(valor, parcelas).at(-1) ?? 0)}` : `${parcelas}x`} · 1ª parcela na ${quando}`
          : `Entra na ${quando}`;
    } else if (parcelas > 1) {
      const ultimas = gerarParcelas(valido ? valor : parcelas, parcelas, dataCompra, null);
      previa = `${valido ? `${parcelas}x de ${formatCurrencyBRL(ultimas.at(-1)?.valor ?? 0)}` : `${parcelas}x`}, uma por mês até ${formatDatePtBr(ultimas.at(-1)!.data)}`;
    }
  }

  async function onSubmit(values: ManualTransactionInput) {
    const url = transacao
      ? `/api/transactions/${transacao.id}${editandoParcela && aplicarATodas ? "?escopo=todas" : ""}`
      : "/api/transactions";
    const method = transacao ? "PATCH" : "POST";
    // Receita nao tem cartao nem parcelas.
    const corpo = values.tipo === "receita" ? { ...values, cartaoId: null, parcelas: 1 } : values;

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(corpo),
    });

    if (!res.ok) {
      const resposta: { error?: string } = await res.json().catch(() => ({}));
      toast.error(resposta.error ?? "Não foi possível salvar a transação.");
      return;
    }

    toast.success(
      transacao
        ? "Transação atualizada."
        : (corpo.parcelas ?? 1) > 1
          ? `Compra lançada em ${corpo.parcelas} parcelas.`
          : "Transação adicionada.",
    );
    setAberto(false);
    if (!transacao) reset();
    limparParametroNova(router);
    router.refresh();
  }

  return (
    <Dialog
      open={aberto}
      onOpenChange={(valor) => {
        setAberto(valor);
        if (!valor) {
          reset();
          setAplicarATodas(false);
          limparParametroNova(router);
        }
      }}
    >
      <DialogTrigger render={trigger} />
      <DialogContent className="max-h-[92dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{transacao ? "Editar transação" : "Nova transação"}</DialogTitle>
          <DialogDescription>
            {transacao
              ? "Corrija os dados dessa transação."
              : "Adicione uma transação manualmente (sem precisar do WhatsApp)."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          {transacao && (editandoNoCartao || editandoParcela) && (
            <div className="flex items-start gap-2.5 rounded-xl border border-border/70 bg-muted/50 p-3 text-xs text-muted-foreground">
              <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
              <p>
                {transacao.cartao && <span className="font-medium text-foreground">{transacao.cartao.nome}</span>}
                {transacao.cartao && " · "}
                {editandoParcela && `parcela ${transacao.parcelaNumero} de ${transacao.parcelaTotal} · `}
                compra em {formatDatePtBr(transacao.dataCompra ?? transacao.data)}
                {transacao.cartao && `, conta no mês da fatura (vence ${formatDatePtBr(transacao.data)})`}. Pra mudar o
                cartão, as parcelas ou a data, exclua e lance de novo.
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="tipo">Tipo</Label>
              <Controller
                control={control}
                name="tipo"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    disabled={editandoParcela}
                    onValueChange={(v) => {
                      if (!v) return;
                      field.onChange(v);
                      // Trocou o tipo e a categoria atual nao aceita o novo? Volta pra "Outros".
                      const atual = getValues("categoria");
                      if (!categorias.doTipo(v).some((c) => c.nome === atual)) {
                        setValue("categoria", CATEGORIA_FALLBACK);
                      }
                    }}
                  >
                    <SelectTrigger id="tipo" className="w-full">
                      <SelectValue>{(v: string) => (v === "receita" ? "Receita" : "Despesa")}</SelectValue>
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
              <Label htmlFor="valor">
                {editandoParcela ? "Valor desta parcela (R$)" : parcelas > 1 && !transacao ? "Valor total (R$)" : "Valor (R$)"}
              </Label>
              <Input id="valor" type="number" step="0.01" min="0" {...register("valor", { valueAsNumber: true })} />
              {errors.valor && <p className="text-xs text-destructive">{errors.valor.message}</p>}
            </div>
          </div>

          {!transacao && ehDespesa && (
            <div className="grid grid-cols-[1fr_7.5rem] gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="pagamento">Pagamento</Label>
                <Controller
                  control={control}
                  name="cartaoId"
                  render={({ field }) => (
                    <Select
                      value={field.value ?? SEM_CARTAO}
                      onValueChange={(v) => v && field.onChange(v === SEM_CARTAO ? null : v)}
                    >
                      <SelectTrigger id="pagamento" className="w-full">
                        <SelectValue>
                          {(v: string) => {
                            const escolhido = cartoes.find((c) => c.id === v);
                            return escolhido ? (
                              <>
                                <CreditCard className="size-4" style={{ color: corDaCategoria(escolhido.cor).light }} />
                                {escolhido.nome}
                              </>
                            ) : (
                              <>
                                <Wallet className="size-4 text-muted-foreground" />
                                Dinheiro, débito ou Pix
                              </>
                            );
                          }}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={SEM_CARTAO}>
                          <Wallet className="size-4 text-muted-foreground" />
                          Dinheiro, débito ou Pix
                        </SelectItem>
                        {cartoes.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            <CreditCard className="size-4" style={{ color: corDaCategoria(c.cor).light }} />
                            {c.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="parcelas">Parcelas</Label>
                <Controller
                  control={control}
                  name="parcelas"
                  render={({ field }) => (
                    <Select value={String(field.value ?? 1)} onValueChange={(v) => v && field.onChange(Number(v))}>
                      <SelectTrigger id="parcelas" className="w-full">
                        <SelectValue>{(v: string) => (v === "1" ? "À vista" : `${v}x`)}</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {OPCOES_PARCELAS.map((n) => (
                          <SelectItem key={n} value={String(n)}>
                            {n === 1 ? "À vista" : `${n}x`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              {previa && (
                <p className="col-span-2 -mt-1 flex animate-in items-center gap-1.5 text-xs text-muted-foreground fade-in-0">
                  <CreditCard className="size-3.5 shrink-0" aria-hidden />
                  {previa}
                </p>
              )}
              {!cartao && cartoes.length === 0 && (
                <p className="col-span-2 -mt-1 text-xs text-muted-foreground">
                  Cadastre seus cartões em <span className="font-medium">Cartões</span> pra lançar compras na fatura.
                </p>
              )}
            </div>
          )}

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

          {!(transacao && (editandoNoCartao || editandoParcela)) && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="data">{cartao || parcelas > 1 ? "Data da compra" : "Data"}</Label>
              <Controller
                control={control}
                name="data"
                render={({ field }) => (
                  <Input
                    id="data"
                    type="date"
                    value={paraInputDate(field.value as Date)}
                    onChange={(e) => e.target.value && field.onChange(new Date(`${e.target.value}T00:00:00`))}
                  />
                )}
              />
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="descricao">Descrição (opcional)</Label>
            <Textarea id="descricao" rows={2} {...register("descricao")} />
          </div>

          {editandoParcela && (
            <label className="flex cursor-pointer items-center gap-2.5 text-sm">
              <input
                type="checkbox"
                checked={aplicarATodas}
                onChange={(e) => setAplicarATodas(e.target.checked)}
                className="size-4 accent-primary"
              />
              Aplicar descrição e categoria às {transacao?.parcelaTotal} parcelas
            </label>
          )}

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {transacao ? "Salvar alterações" : parcelas > 1 && ehDespesa ? `Lançar ${parcelas} parcelas` : "Adicionar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
