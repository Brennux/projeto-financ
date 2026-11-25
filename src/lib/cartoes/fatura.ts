import { dataNoMes, hojeNoApp } from "@/lib/recorrencias/datas";

/**
 * Regras de fatura de cartao, iguais as dos bancos brasileiros:
 *  - compra ANTES do dia de fechamento cai na fatura que fecha neste mes;
 *    no dia do fechamento ou depois, ja vai pra proxima ("melhor dia de compra");
 *  - o vencimento vem depois do fechamento: no mesmo mes se o dia de
 *    vencimento for maior que o de fechamento, senao no mes seguinte;
 *  - a fatura e identificada pelo MES DO VENCIMENTO, e e nesse mes que o
 *    gasto conta no app (a transacao guarda o vencimento em `data`).
 *
 * Datas sempre como meia-noite UTC do dia (o formato de uma coluna @db.Date).
 */

export interface RegraCartao {
  diaFechamento: number;
  diaVencimento: number;
}

const UM_DIA_MS = 24 * 60 * 60 * 1000;

/** So o dia do calendario (meia-noite UTC), venha a Date de onde vier. */
export function soData(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function mesSomado(mes: Date, meses: number): Date {
  return new Date(Date.UTC(mes.getUTCFullYear(), mes.getUTCMonth() + meses, 1));
}

/** Mes (dia 1, UTC) da fatura em que cai uma compra feita em `dataCompra`. */
export function mesDaFatura(dataCompra: Date, cartao: RegraCartao): Date {
  const compra = soData(dataCompra);
  const ano = compra.getUTCFullYear();
  const mes = compra.getUTCMonth();
  const fechamentoNesteMes = dataNoMes(ano, mes, cartao.diaFechamento);
  const mesDoFechamento = compra < fechamentoNesteMes ? mes : mes + 1;
  const mesDoVencimento = cartao.diaVencimento > cartao.diaFechamento ? mesDoFechamento : mesDoFechamento + 1;
  return new Date(Date.UTC(ano, mesDoVencimento, 1));
}

export function vencimentoDaFatura(mes: Date, cartao: RegraCartao): Date {
  return dataNoMes(mes.getUTCFullYear(), mes.getUTCMonth(), cartao.diaVencimento);
}

export function fechamentoDaFatura(mes: Date, cartao: RegraCartao): Date {
  const mesDoFechamento = cartao.diaVencimento > cartao.diaFechamento ? mes.getUTCMonth() : mes.getUTCMonth() - 1;
  return dataNoMes(mes.getUTCFullYear(), mesDoFechamento, cartao.diaFechamento);
}

/** Compras que entram na fatura: do fechamento anterior ate a vespera do fechamento. */
export function periodoDaFatura(mes: Date, cartao: RegraCartao) {
  const fechamento = fechamentoDaFatura(mes, cartao);
  return {
    inicio: fechamentoDaFatura(mesSomado(mes, -1), cartao),
    fim: new Date(fechamento.getTime() - UM_DIA_MS),
    fechamento,
    vencimento: vencimentoDaFatura(mes, cartao),
  };
}

/** A fatura que recebe as compras feitas hoje. */
export function mesDaFaturaAtual(cartao: RegraCartao, hoje: Date = hojeNoApp()): Date {
  return mesDaFatura(hoje, cartao);
}

/**
 * Divide o total em N parcelas, em centavos exatos. A sobra da divisao fica
 * na 1a parcela, como nos bancos (R$ 100 em 3x = 33,34 + 33,33 + 33,33).
 */
export function dividirEmParcelas(total: number, parcelas: number): number[] {
  const centavos = Math.round(total * 100);
  const base = Math.floor(centavos / parcelas);
  const sobra = centavos - base * parcelas;
  return Array.from({ length: parcelas }, (_, i) => (base + (i === 0 ? sobra : 0)) / 100);
}

export interface Parcela {
  numero: number;
  valor: number;
  /** Data em que a parcela conta: vencimento da fatura (cartao) ou o mesmo dia, N meses depois (sem cartao). */
  data: Date;
}

/**
 * As N parcelas de uma compra. No cartao, uma por fatura a partir da fatura
 * da compra; sem cartao (carne, boleto), uma por mes a partir da data da compra.
 */
export function gerarParcelas(
  total: number,
  quantidade: number,
  dataCompra: Date,
  cartao?: RegraCartao | null,
): Parcela[] {
  const valores = dividirEmParcelas(total, quantidade);
  const compra = soData(dataCompra);
  if (cartao) {
    const primeiraFatura = mesDaFatura(compra, cartao);
    return valores.map((valor, i) => ({
      numero: i + 1,
      valor,
      data: vencimentoDaFatura(mesSomado(primeiraFatura, i), cartao),
    }));
  }
  return valores.map((valor, i) => ({
    numero: i + 1,
    valor,
    data: dataNoMes(compra.getUTCFullYear(), compra.getUTCMonth() + i, compra.getUTCDate()),
  }));
}

export type StatusFatura = "aberta" | "fechada" | "vencida" | "paga";

/**
 * aberta: ainda recebe compras; fechada: fechou, aguardando pagamento;
 * vencida: passou do vencimento sem ser marcada como paga.
 */
export function statusDaFatura(mes: Date, cartao: RegraCartao, paga: boolean, hoje: Date = hojeNoApp()): StatusFatura {
  if (paga) return "paga";
  if (hoje < fechamentoDaFatura(mes, cartao)) return "aberta";
  if (hoje <= vencimentoDaFatura(mes, cartao)) return "fechada";
  return "vencida";
}

/** "2026-12" -> 1/12/2026 (UTC). null se invalido. */
export function lerMesDaFatura(texto: string | undefined | null): Date | null {
  if (!texto || !/^\d{4}-\d{2}$/.test(texto)) return null;
  const [ano, mes] = texto.split("-").map(Number);
  if (mes < 1 || mes > 12) return null;
  return new Date(Date.UTC(ano, mes - 1, 1));
}

/** 1/12/2026 -> "2026-12". */
export function chaveDoMes(mes: Date): string {
  return `${mes.getUTCFullYear()}-${String(mes.getUTCMonth() + 1).padStart(2, "0")}`;
}
