"use client";

import { useTransition } from "react";
import { CheckCircle2, CircleDot, Clock, OctagonAlert, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { marcarFaturaPaga } from "@/app/actions/cartoes";
import { STATUS_COLORS } from "@/lib/constants/chart-colors";
import type { StatusFatura } from "@/lib/cartoes/fatura";
import { cn } from "@/lib/utils";

const ROTULO: Record<StatusFatura, { texto: string; Icone: typeof CheckCircle2; cor: { light: string; dark: string } | null }> = {
  aberta: { texto: "Aberta", Icone: CircleDot, cor: null },
  fechada: { texto: "Fechada", Icone: Clock, cor: STATUS_COLORS.warning },
  vencida: { texto: "Vencida", Icone: OctagonAlert, cor: STATUS_COLORS.critical },
  paga: { texto: "Paga", Icone: CheckCircle2, cor: STATUS_COLORS.good },
};

/** Selo de status (icone + texto; a cor fica no fundo/icone, o texto e o normal -- contraste). */
export function SeloStatusFatura({ status, className }: { status: StatusFatura; className?: string }) {
  const { texto, Icone, cor } = ROTULO[status];
  return (
    <span
      className={cn(
        "inline-flex h-6 shrink-0 items-center gap-1.5 rounded-full px-2.5 text-xs font-semibold text-foreground",
        cor ? "bg-(--cor-claro)/14 dark:bg-(--cor-escuro)/18" : "bg-primary/12",
        className,
      )}
      style={cor ? ({ "--cor-claro": cor.light, "--cor-escuro": cor.dark } as React.CSSProperties) : undefined}
    >
      <Icone className={cn("size-3.5", cor ? "text-(--cor-claro) dark:text-(--cor-escuro)" : "text-primary")} aria-hidden />
      {texto}
    </span>
  );
}

interface BotaoProps {
  cartaoId: string;
  /** "2026-12" */
  mes: string;
  paga: boolean;
  tamanho?: "sm" | "default";
}

/**
 * Marcar/desmarcar a fatura como paga. Pagar nao cria despesa (o gasto ja
 * foi contado compra a compra): so libera o limite e muda o status.
 */
export function BotaoPagarFatura({ cartaoId, mes, paga, tamanho = "default" }: BotaoProps) {
  const [salvando, iniciar] = useTransition();

  function alternar() {
    iniciar(async () => {
      const resultado = await marcarFaturaPaga(cartaoId, mes, !paga);
      if (!resultado.ok) toast.error(resultado.erro);
      else toast.success(paga ? "Fatura marcada como não paga." : "Fatura marcada como paga.");
    });
  }

  return paga ? (
    <Button type="button" variant="ghost" size={tamanho} onClick={alternar} disabled={salvando}>
      <Undo2 className="size-4" />
      Desfazer pagamento
    </Button>
  ) : (
    <Button type="button" size={tamanho} onClick={alternar} disabled={salvando}>
      <CheckCircle2 className="size-4" />
      {salvando ? "Salvando..." : "Marcar como paga"}
    </Button>
  );
}
