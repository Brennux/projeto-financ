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

export function buildUnrecognizedSenderMessage(): string {
  return (
    "👋 Não reconheço esse número por aqui. Se você já tem conta, gere um código em " +
    "Configurações > WhatsApp e me mande só o código. Se ainda não tem conta, peça um convite " +
    "pra quem já usa o app."
  );
}

export function buildLinkSuccessMessage(userName: string): string {
  return `✅ Número vinculado à conta de ${userName}. Agora é só me mandar seus gastos por aqui.`;
}

export function buildLinkExpiredMessage(): string {
  return "🤔 Esse código expirou ou já foi usado. Gere um novo em Configurações > WhatsApp.";
}

export function buildLinkConflictMessage(): string {
  return "⚠️ Esse número já está vinculado a outra conta. Se isso for engano, fale com quem administra o app.";
}
