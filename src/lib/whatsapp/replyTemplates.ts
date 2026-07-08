import type { ParsedTransaction } from "@/lib/parser";
import { formatCurrencyBRL, formatDatePtBr } from "@/lib/format";

export function buildConfirmationMessage(transacao: ParsedTransaction): string {
  const rotulo = transacao.tipo === "despesa" ? "Despesa" : "Receita";
  const emoji = transacao.tipo === "despesa" ? "✅" : "💰";
  return (
    `${emoji} ${rotulo} de ${formatCurrencyBRL(transacao.valor)} em ${transacao.categoria} ` +
    `registrada (${formatDatePtBr(transacao.data)}).`
  );
}

export function buildFailureMessage(): string {
  return (
    "🤔 Não entendi essa mensagem. Tente algo como:\n" +
    '"Paguei 58,90 no mercado" ou "Recebi 1500 de salário".'
  );
}
