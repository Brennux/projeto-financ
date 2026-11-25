// Sem "server-only": o worker do WhatsApp tambem registra compras no cartao.
import { randomUUID } from "node:crypto";
import prisma from "@/lib/prisma";
import type { Tipo } from "@/lib/parser/types";
import { hojeNoApp } from "@/lib/recorrencias/datas";
import {
  chaveDoMes,
  fechamentoDaFatura,
  gerarParcelas,
  mesDaFatura,
  mesDaFaturaAtual,
  periodoDaFatura,
  soData,
  statusDaFatura,
  vencimentoDaFatura,
  type Parcela,
  type RegraCartao,
  type StatusFatura,
} from "./fatura";

export interface CartaoInfo extends RegraCartao {
  id: string;
  nome: string;
  cor: string;
  limite: number | null;
  ativo: boolean;
}

function paraInfo(c: {
  id: string;
  nome: string;
  cor: string;
  limite: unknown;
  diaFechamento: number;
  diaVencimento: number;
  ativo: boolean;
}): CartaoInfo {
  return {
    id: c.id,
    nome: c.nome,
    cor: c.cor,
    limite: c.limite == null ? null : Number(c.limite),
    diaFechamento: c.diaFechamento,
    diaVencimento: c.diaVencimento,
    ativo: c.ativo,
  };
}

export async function getCartoes(householdId: string, incluirArquivados = false): Promise<CartaoInfo[]> {
  const cartoes = await prisma.creditCard.findMany({
    where: { householdId, ...(incluirArquivados ? {} : { ativo: true }) },
    orderBy: [{ ativo: "desc" }, { criadoEm: "asc" }],
  });
  return cartoes.map(paraInfo);
}

export async function getCartao(householdId: string, id: string): Promise<CartaoInfo | null> {
  const cartao = await prisma.creditCard.findFirst({ where: { id, householdId } });
  return cartao ? paraInfo(cartao) : null;
}

export interface NovaCompra {
  householdId: string;
  userId: string | null;
  tipo: Tipo;
  valorTotal: number;
  categoria: string;
  descricao: string | null;
  dataCompra: Date;
  parcelas: number;
  cartao: CartaoInfo | null;
  origem: string;
  whatsappMessageId?: string;
  mensagemOriginal?: string;
  remetente?: string;
}

/**
 * Registra um lancamento -- a vista ou parcelado, no cartao ou nao. E o
 * unico caminho de criacao usado pelo formulario e pelo WhatsApp, entao a
 * regra de "em que mes conta" mora num lugar so:
 *  - sem cartao e a vista: data = data da compra (como sempre foi);
 *  - no cartao: cada parcela conta no vencimento da sua fatura;
 *  - parcelado sem cartao (carne): uma parcela por mes a partir da compra.
 * Tudo numa transacao do banco: ou entram todas as parcelas, ou nenhuma.
 */
export async function registrarLancamento(compra: NovaCompra): Promise<Parcela[]> {
  const dataCompra = soData(compra.dataCompra);
  const quantidade = compra.tipo === "receita" ? 1 : Math.max(1, compra.parcelas);
  const parcelas =
    compra.cartao || quantidade > 1
      ? gerarParcelas(compra.valorTotal, quantidade, dataCompra, compra.cartao)
      : [{ numero: 1, valor: compra.valorTotal, data: dataCompra }];
  const parcelamentoId = quantidade > 1 ? randomUUID() : null;

  await prisma.transaction.createMany({
    data: parcelas.map((p, i) => ({
      householdId: compra.householdId,
      userId: compra.userId,
      tipo: compra.tipo,
      valor: p.valor,
      categoria: compra.categoria,
      descricao: compra.descricao,
      data: p.data,
      origem: compra.origem,
      cartaoId: compra.cartao?.id ?? null,
      dataCompra: compra.cartao || quantidade > 1 ? dataCompra : null,
      parcelamentoId,
      parcelaNumero: parcelamentoId ? p.numero : null,
      parcelaTotal: parcelamentoId ? quantidade : null,
      // So a 1a parcela carrega a mensagem do WhatsApp: e ela que deduplica
      // um reenvio (whatsappMessageId e unico).
      ...(i === 0
        ? { whatsappMessageId: compra.whatsappMessageId, mensagemOriginal: compra.mensagemOriginal, remetente: compra.remetente }
        : {}),
    })),
  });

  return parcelas;
}

export interface FaturaResumo {
  /** "2026-12" */
  mes: string;
  total: number;
  fechamento: Date;
  vencimento: Date;
  status: StatusFatura;
}

export interface CartaoComFaturas extends CartaoInfo {
  /** Fatura que recebe as compras de hoje. */
  faturaAtual: FaturaResumo;
  /** Fatura fechada (ou vencida) ainda nao paga, se houver -- a que precisa ser paga agora. */
  aPagar: FaturaResumo | null;
  /** Tudo o que ainda nao foi pago, inclusive parcelas futuras (consome o limite). */
  limiteUsado: number;
  /** Faturas seguintes a atual com algo ja lancado (parcelas). */
  proximas: FaturaResumo[];
}

const MESES_A_FRENTE = 12;

function somarMes(mes: Date, n: number): Date {
  return new Date(Date.UTC(mes.getUTCFullYear(), mes.getUTCMonth() + n, 1));
}

/**
 * Situacao de cada cartao: fatura atual, a que esta pra pagar, limite usado
 * e o que ja esta comprometido nos proximos meses. A fatura nao e guardada:
 * e a soma das transacoes do cartao com vencimento naquele mes.
 */
export async function getResumoDosCartoes(householdId: string, incluirArquivados = false): Promise<CartaoComFaturas[]> {
  const cartoes = await getCartoes(householdId, incluirArquivados);
  if (cartoes.length === 0) return [];

  const ids = cartoes.map((c) => c.id);
  const [lancamentos, pagas] = await Promise.all([
    prisma.transaction.groupBy({
      by: ["cartaoId", "data", "tipo"],
      where: { householdId, cartaoId: { in: ids } },
      _sum: { valor: true },
    }),
    prisma.faturaPaga.findMany({ where: { cartaoId: { in: ids } }, select: { cartaoId: true, mes: true } }),
  ]);

  const hoje = hojeNoApp();
  return cartoes.map((cartao) => {
    const totalPorMes = new Map<string, number>();
    for (const l of lancamentos) {
      if (l.cartaoId !== cartao.id) continue;
      const chave = chaveDoMes(l.data);
      const valor = Number(l._sum.valor ?? 0) * (l.tipo === "despesa" ? 1 : -1);
      totalPorMes.set(chave, (totalPorMes.get(chave) ?? 0) + valor);
    }
    const pagasDoCartao = new Set(pagas.filter((p) => p.cartaoId === cartao.id).map((p) => chaveDoMes(p.mes)));

    const resumo = (mes: Date): FaturaResumo => {
      const chave = chaveDoMes(mes);
      return {
        mes: chave,
        total: Math.round((totalPorMes.get(chave) ?? 0) * 100) / 100,
        fechamento: fechamentoDaFatura(mes, cartao),
        vencimento: vencimentoDaFatura(mes, cartao),
        status: statusDaFatura(mes, cartao, pagasDoCartao.has(chave), hoje),
      };
    };

    const mesAtual = mesDaFaturaAtual(cartao, hoje);
    const anteriorNaoPaga = [...totalPorMes.keys()]
      .filter((chave) => chave < chaveDoMes(mesAtual) && !pagasDoCartao.has(chave) && (totalPorMes.get(chave) ?? 0) > 0)
      .sort()
      .at(-1);

    const limiteUsado = [...totalPorMes.entries()]
      .filter(([chave]) => !pagasDoCartao.has(chave))
      .reduce((soma, [, total]) => soma + total, 0);

    const proximas = Array.from({ length: MESES_A_FRENTE }, (_, i) => resumo(somarMes(mesAtual, i + 1))).filter(
      (f) => f.total !== 0,
    );

    const [ano, mes] = (anteriorNaoPaga ?? "").split("-").map(Number);
    return {
      ...cartao,
      faturaAtual: resumo(mesAtual),
      aPagar: anteriorNaoPaga ? resumo(new Date(Date.UTC(ano, mes - 1, 1))) : null,
      limiteUsado: Math.max(0, Math.round(limiteUsado * 100) / 100),
      proximas,
    };
  });
}

/** Uma fatura com todos os lancamentos dela (pagina do cartao). */
export async function getFatura(householdId: string, cartao: CartaoInfo, mes: Date) {
  const fimDoMes = somarMes(mes, 1);
  const [linhas, paga] = await Promise.all([
    prisma.transaction.findMany({
      where: { householdId, cartaoId: cartao.id, data: { gte: mes, lt: fimDoMes } },
      include: { user: { select: { id: true, nome: true } } },
      orderBy: [{ dataCompra: "desc" }, { criadoEm: "desc" }],
    }),
    prisma.faturaPaga.findUnique({ where: { cartaoId_mes: { cartaoId: cartao.id, mes } } }),
  ]);

  const total = linhas.reduce((soma, l) => soma + Number(l.valor) * (l.tipo === "despesa" ? 1 : -1), 0);
  return {
    mes: chaveDoMes(mes),
    ...periodoDaFatura(mes, cartao),
    status: statusDaFatura(mes, cartao, Boolean(paga)),
    pagaEm: paga?.pagaEm ?? null,
    total: Math.round(total * 100) / 100,
    lancamentos: linhas.map((l) => ({
      id: l.id,
      tipo: l.tipo,
      valor: Number(l.valor),
      categoria: l.categoria,
      descricao: l.descricao,
      dataCompra: l.dataCompra ?? l.data,
      parcelaNumero: l.parcelaNumero,
      parcelaTotal: l.parcelaTotal,
      autor: l.user,
    })),
  };
}

/** Em qual fatura (mes "yyyy-mm") uma compra de hoje cairia -- usado nas mensagens do bot. */
export function faturaDeUmaCompra(cartao: RegraCartao, dataCompra: Date): string {
  return chaveDoMes(mesDaFatura(dataCompra, cartao));
}
