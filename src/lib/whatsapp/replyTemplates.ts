import type { ParsedTransaction } from "@/lib/parser";
import { formatCurrencyBRL, formatDatePtBr } from "@/lib/format";

/** Limiar do aviso de orcamento (fracao do limite). */
export const LIMIAR_AVISO_ORCAMENTO = 0.8;

export function buildConfirmationMessage(transacao: ParsedTransaction, alertaOrcamento?: string | null): string {
  const rotulo = transacao.tipo === "despesa" ? "Despesa" : "Receita";
  const emoji = transacao.tipo === "despesa" ? "✅" : "💰";
  const linhas = [
    `${emoji} ${rotulo} de ${formatCurrencyBRL(transacao.valor)} em ${transacao.categoria} ` +
      `registrada (${formatDatePtBr(transacao.data)}).`,
  ];
  if (alertaOrcamento) linhas.push(alertaOrcamento);
  linhas.push("↩️ Errou? Mande *desfazer*.");
  return linhas.join("\n");
}

/**
 * Aviso anexado a confirmacao quando a categoria passa de 80% (ou estoura)
 * o orcamento do mes. null quando nao ha nada a avisar.
 */
export function buildAlertaOrcamento(categoria: string, gasto: number, limite: number): string | null {
  if (limite <= 0) return null;
  const percentual = gasto / limite;
  const valores = `${formatCurrencyBRL(gasto)} de ${formatCurrencyBRL(limite)}`;
  if (percentual >= 1) {
    return `🚨 ${categoria}: orçamento estourado, ${Math.round(percentual * 100)}% usado (${valores}).`;
  }
  if (percentual >= LIMIAR_AVISO_ORCAMENTO) {
    return `⚠️ ${categoria}: ${Math.round(percentual * 100)}% do orçamento usado (${valores}).`;
  }
  return null;
}

const mesPorExtenso = new Intl.DateTimeFormat("pt-BR", { month: "long", timeZone: "UTC" });
const mesComAno = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" });

/** "dezembro" (ano atual) ou "março de 2027". */
function nomeDoMesDaData(data: Date): string {
  return data.getUTCFullYear() === new Date().getUTCFullYear() ? mesPorExtenso.format(data) : mesComAno.format(data);
}

/**
 * Confirmacao de compra no cartao e/ou parcelada:
 * "✅ R$ 1.200,00 em 10x de R$ 120,00 no Nubank, em Lazer. 1ª parcela na
 * fatura de dezembro (vence 10/12); a última, em setembro de 2027."
 */
export function buildConfirmacaoCompra(
  compra: { valorTotal: number; categoria: string; cartaoNome: string | null; parcelas: { valor: number; data: Date }[] },
  alertaOrcamento?: string | null,
): string {
  const { valorTotal, categoria, cartaoNome, parcelas } = compra;
  const primeira = parcelas[0];
  const ultima = parcelas[parcelas.length - 1];
  const noCartao = cartaoNome ? ` no ${cartaoNome}` : "";
  const linhas: string[] = [];

  if (parcelas.length > 1) {
    const valorParcela = formatCurrencyBRL(ultima.valor);
    linhas.push(
      `✅ ${formatCurrencyBRL(valorTotal)} em ${parcelas.length}x de ${valorParcela}${noCartao}, em ${categoria}.`,
      cartaoNome
        ? `1ª parcela na fatura de ${nomeDoMesDaData(primeira.data)} (vence ${formatDatePtBr(primeira.data)}); a última, em ${nomeDoMesDaData(ultima.data)}.`
        : `Uma parcela por mês, de ${formatDatePtBr(primeira.data)} a ${formatDatePtBr(ultima.data)}.`,
    );
  } else {
    linhas.push(
      `✅ Despesa de ${formatCurrencyBRL(valorTotal)}${noCartao} em ${categoria}` +
        (cartaoNome ? `, na fatura de ${nomeDoMesDaData(primeira.data)} (vence ${formatDatePtBr(primeira.data)}).` : "."),
    );
  }
  if (alertaOrcamento) linhas.push(alertaOrcamento);
  linhas.push("↩️ Errou? Mande *desfazer*.");
  return linhas.join("\n");
}

export function buildQualCartaoMessage(nomes: string[]): string {
  return `💳 Em qual cartão? Mande de novo dizendo o nome: ${nomes.map((n) => `*${n}*`).join(" ou ")}.\nEx.: "gastei 1200 na tv no ${nomes[0]} em 10x"`;
}

const ROTULO_STATUS_FATURA: Record<string, string> = {
  aberta: "aberta",
  fechada: "fechada, aguardando pagamento",
  vencida: "vencida",
  paga: "paga",
};

export interface FaturaParaMensagem {
  mes: string;
  total: number;
  fechamento: Date;
  vencimento: Date;
  status: string;
}

/** Resposta do comando "fatura": a atual de cada cartao e, se houver, a que esta pra pagar. */
export function buildFaturasMessage(
  cartoes: { nome: string; faturaAtual: FaturaParaMensagem; aPagar: FaturaParaMensagem | null }[],
): string {
  const blocos = cartoes.map(({ nome, faturaAtual, aPagar }) => {
    const linhas = [`💳 *${nome}*`];
    if (aPagar) {
      linhas.push(
        `⚠️ Fatura de ${nomeDoMesDaData(aPagar.vencimento)}: *${formatCurrencyBRL(aPagar.total)}* (${ROTULO_STATUS_FATURA[aPagar.status] ?? aPagar.status}, vence ${formatDatePtBr(aPagar.vencimento)})`,
      );
    }
    linhas.push(
      `Fatura de ${nomeDoMesDaData(faturaAtual.vencimento)}: *${formatCurrencyBRL(faturaAtual.total)}* (${ROTULO_STATUS_FATURA[faturaAtual.status] ?? faturaAtual.status}, fecha ${formatDatePtBr(faturaAtual.fechamento)}, vence ${formatDatePtBr(faturaAtual.vencimento)})`,
    );
    return linhas.join("\n");
  });
  return blocos.join("\n\n") + "\n\nQuando pagar, marque como paga no app (Cartões).";
}

export function buildSemCartoesMessage(): string {
  return "💳 Você ainda não cadastrou cartões. Cadastre em *Cartões* no app (com o dia de fechamento e vencimento) e depois é só me dizer \"no Nubank em 10x\".";
}

export function buildFailureMessage(): string {
  return (
    "🤔 Não entendi essa mensagem. Tente algo como:\n" +
    '"Paguei 58,90 no mercado" ou "Recebi 1500 de salário".\n' +
    "Mande *ajuda* pra ver tudo o que eu entendo."
  );
}

export function buildHelpMessage(categorias: string[]): string {
  return [
    "👋 *Como usar*",
    "",
    "*Lançar um gasto ou receita*",
    "• Paguei 58,90 no mercado",
    "• Gastei 30 de uber ontem",
    "• Recebi 1500 de salário",
    "",
    "*No cartão e parcelado*",
    "• Gastei 90 no mercado no Nubank",
    "• Comprei uma tv de 1200 no Nubank em 10x",
    "• Celular 12x de 99,90 no crédito",
    "",
    "*Comandos*",
    "• *desfazer*: apaga o último lançamento que você mandou",
    "• *saldo*: entradas, saídas e saldo do mês",
    "• *resumo*: saldo + onde mais gastou + orçamentos",
    "• *quanto gastei com mercado*: total de uma categoria no mês",
    "• *fatura* (ou *fatura do nubank*): faturas dos cartões",
    '• Funciona com "mês passado" também: *saldo mês passado*',
    "",
    `*Categorias*: ${categorias.join(", ")}.`,
  ].join("\n");
}

export function buildDesfeitoMessage(transacao: {
  tipo: "despesa" | "receita";
  valor: number;
  categoria: string;
  data: Date;
  /** Compra parcelada inteira apagada: total e quantidade de parcelas. */
  parcelamento?: { total: number; parcelas: number } | null;
}): string {
  if (transacao.parcelamento) {
    return (
      `🗑️ Apaguei a compra de ${formatCurrencyBRL(transacao.parcelamento.total)} em ` +
      `${transacao.parcelamento.parcelas}x em ${transacao.categoria} (todas as parcelas).`
    );
  }
  const rotulo = transacao.tipo === "despesa" ? "Despesa" : "Receita";
  return (
    `🗑️ Apaguei: ${rotulo} de ${formatCurrencyBRL(transacao.valor)} em ${transacao.categoria} ` +
    `(${formatDatePtBr(transacao.data)}).`
  );
}

export function buildNadaParaDesfazerMessage(): string {
  return "🤷 Não achei nenhum lançamento seu pelo WhatsApp nas últimas 24h pra desfazer. Pra apagar algo mais antigo, use o app.";
}

export interface ResumoSaldo {
  receitas: number;
  despesas: number;
  saldo: number;
}

export function buildSaldoMessage(mes: string, resumo: ResumoSaldo): string {
  const sinal = resumo.saldo >= 0 ? "🟢" : "🔴";
  return [
    `${sinal} *Saldo de ${mes}: ${formatCurrencyBRL(resumo.saldo)}*`,
    `Entradas: ${formatCurrencyBRL(resumo.receitas)}`,
    `Saídas: ${formatCurrencyBRL(resumo.despesas)}`,
  ].join("\n");
}

export function buildResumoMessage(
  mes: string,
  resumo: ResumoSaldo,
  maioresGastos: { categoria: string; total: number }[],
  orcamentos: { categoria: string; gasto: number; limite: number }[],
): string {
  const linhas = [buildSaldoMessage(mes, resumo)];

  if (maioresGastos.length > 0) {
    linhas.push("", "*Onde mais gastou*");
    for (const g of maioresGastos) linhas.push(`• ${g.categoria}: ${formatCurrencyBRL(g.total)}`);
  }

  const avisos = orcamentos
    .map((o) => buildAlertaOrcamento(o.categoria, o.gasto, o.limite))
    .filter((a): a is string => a !== null);
  if (avisos.length > 0) {
    linhas.push("", "*Orçamentos*", ...avisos);
  } else if (orcamentos.length > 0) {
    linhas.push("", "✅ Todos os orçamentos abaixo de 80%.");
  }

  return linhas.join("\n");
}

export function buildQuantoMessage(
  mes: string,
  categoria: string | null,
  total: number,
  quantidade: number,
  orcamento?: { limite: number } | null,
): string {
  const alvo = categoria ? `com ${categoria}` : "no total";
  if (quantidade === 0) return `🧾 Nenhum gasto ${alvo} em ${mes}.`;

  const lancamentos = quantidade === 1 ? "1 lançamento" : `${quantidade} lançamentos`;
  const linhas = [`🧾 Gastos ${alvo} em ${mes}: *${formatCurrencyBRL(total)}* (${lancamentos}).`];
  if (orcamento && orcamento.limite > 0) {
    const percentual = Math.round((total / orcamento.limite) * 100);
    linhas.push(`Orçamento: ${formatCurrencyBRL(orcamento.limite)} (${percentual}% usado).`);
  }
  return linhas.join("\n");
}

export function buildCategoriaNaoEncontradaMessage(termo: string, categorias: string[]): string {
  return `🤔 Não achei a categoria "${termo}". As categorias são: ${categorias.join(", ")}.`;
}

export function buildUnrecognizedSenderMessage(): string {
  return (
    "👋 Não reconheço esse número por aqui. Se você já tem conta, gere um código em " +
    "Configurações > WhatsApp e me mande só o código. Se ainda não tem conta, peça um convite " +
    "pra quem já usa o app."
  );
}

export function buildLinkSuccessMessage(userName: string): string {
  return `✅ Número vinculado à conta de ${userName}. Agora é só me mandar seus gastos por aqui. Mande *ajuda* pra ver exemplos.`;
}

export function buildLinkExpiredMessage(): string {
  return "🤔 Esse código expirou ou já foi usado. Gere um novo em Configurações > WhatsApp.";
}

export function buildLinkConflictMessage(): string {
  return "⚠️ Esse número já está vinculado a outra conta. Se isso for engano, fale com quem administra o app.";
}
