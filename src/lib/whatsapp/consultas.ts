import { endOfMonth, format, startOfMonth, subHours, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import prisma from "@/lib/prisma";
import { getCategorias } from "@/lib/categorias/server";
import { getDespesasPorCategoria, getResumoMensal } from "@/lib/queries/transactions";
import { getOrcamentosComGasto } from "@/lib/queries/budgets";
import { materializarRecorrencias } from "@/lib/recorrencias/server";
import { getResumoDosCartoes } from "@/lib/cartoes/server";
import { normalize } from "@/lib/parser/normalize";
import { encontrarCategoria, type Comando } from "./comandos";
import {
  buildAlertaOrcamento,
  buildCategoriaNaoEncontradaMessage,
  buildDesfeitoMessage,
  buildFaturasMessage,
  buildHelpMessage,
  buildSemCartoesMessage,
  buildNadaParaDesfazerMessage,
  buildQuantoMessage,
  buildResumoMessage,
  buildSaldoMessage,
} from "./replyTemplates";

/** Janela do "desfazer" -- evita apagar por engano algo antigo. */
const JANELA_DESFAZER_HORAS = 24;
const MAIORES_GASTOS_NO_RESUMO = 5;

interface Remetente {
  id: string;
  householdId: string;
}

function nomeDoMes(data: Date): string {
  return format(data, "MMMM", { locale: ptBR });
}

/**
 * Aviso pra anexar a confirmacao de uma despesa, se a categoria passou de
 * 80% do orcamento no mes da transacao.
 */
export async function alertaOrcamentoAposDespesa(
  householdId: string,
  categoria: string,
  data: Date,
): Promise<string | null> {
  const orcamento = await prisma.budget.findUnique({
    where: { householdId_categoria: { householdId, categoria } },
    select: { limite: true },
  });
  if (!orcamento) return null;

  const { _sum } = await prisma.transaction.aggregate({
    where: { householdId, categoria, tipo: "despesa", data: { gte: startOfMonth(data), lte: endOfMonth(data) } },
    _sum: { valor: true },
  });
  return buildAlertaOrcamento(categoria, Number(_sum.valor ?? 0), Number(orcamento.limite));
}

async function desfazer(remetente: Remetente): Promise<string> {
  const ultima = await prisma.transaction.findFirst({
    where: {
      householdId: remetente.householdId,
      userId: remetente.id,
      origem: "whatsapp",
      criadoEm: { gte: subHours(new Date(), JANELA_DESFAZER_HORAS) },
    },
    orderBy: { criadoEm: "desc" },
  });
  if (!ultima) return buildNadaParaDesfazerMessage();

  // Compra parcelada: desfaz a compra inteira (todas as parcelas), que e o
  // que a pessoa mandou numa mensagem so.
  if (ultima.parcelamentoId) {
    const parcelas = await prisma.transaction.findMany({
      where: { parcelamentoId: ultima.parcelamentoId, householdId: remetente.householdId },
      select: { valor: true },
    });
    await prisma.transaction.deleteMany({
      where: { parcelamentoId: ultima.parcelamentoId, householdId: remetente.householdId },
    });
    return buildDesfeitoMessage({
      ...ultima,
      valor: Number(ultima.valor),
      parcelamento: { total: parcelas.reduce((soma, p) => soma + Number(p.valor), 0), parcelas: parcelas.length },
    });
  }

  await prisma.transaction.delete({ where: { id: ultima.id } });
  return buildDesfeitoMessage({ ...ultima, valor: Number(ultima.valor) });
}

async function responderFatura(householdId: string, termo: string | null): Promise<string> {
  const cartoes = await getResumoDosCartoes(householdId);
  if (cartoes.length === 0) return buildSemCartoesMessage();
  if (!termo) return buildFaturasMessage(cartoes);

  const alvo = normalize(termo);
  const escolhidos = cartoes.filter((c) => {
    const nome = normalize(c.nome);
    return nome.includes(alvo) || alvo.includes(nome);
  });
  if (escolhidos.length === 0) {
    return `🤔 Não achei o cartão "${termo}". Seus cartões: ${cartoes.map((c) => c.nome).join(", ")}.`;
  }
  return buildFaturasMessage(escolhidos);
}

export async function responderComando(comando: Comando, remetente: Remetente): Promise<string> {
  const { householdId } = remetente;

  if (comando.tipo === "desfazer") return desfazer(remetente);
  if (comando.tipo === "fatura") return responderFatura(householdId, comando.termo);

  const categorias = await getCategorias(householdId);
  const nomes = categorias.map((c) => c.nome);

  if (comando.tipo === "ajuda") return buildHelpMessage(nomes);

  // Recorrentes vencidos entram antes de qualquer conta de saldo.
  await materializarRecorrencias(householdId);
  const referencia = comando.mesPassado ? subMonths(new Date(), 1) : new Date();
  const mes = nomeDoMes(referencia);

  if (comando.tipo === "saldo") {
    return buildSaldoMessage(mes, await getResumoMensal(householdId, referencia));
  }

  if (comando.tipo === "resumo") {
    const [resumo, porCategoria, orcamentos] = await Promise.all([
      getResumoMensal(householdId, referencia),
      getDespesasPorCategoria(householdId, referencia),
      getOrcamentosComGasto(householdId, referencia),
    ]);
    return buildResumoMessage(mes, resumo, porCategoria.slice(0, MAIORES_GASTOS_NO_RESUMO), orcamentos);
  }

  // "quanto gastei [com X]"
  const categoria = comando.termo ? encontrarCategoria(comando.termo, categorias) : null;
  if (comando.termo && !categoria) return buildCategoriaNaoEncontradaMessage(comando.termo, nomes);

  const [agregado, orcamento] = await Promise.all([
    prisma.transaction.aggregate({
      where: {
        householdId,
        tipo: "despesa",
        data: { gte: startOfMonth(referencia), lte: endOfMonth(referencia) },
        ...(categoria ? { categoria } : {}),
      },
      _sum: { valor: true },
      _count: true,
    }),
    categoria
      ? prisma.budget.findUnique({
          where: { householdId_categoria: { householdId, categoria } },
          select: { limite: true },
        })
      : null,
  ]);

  return buildQuantoMessage(
    mes,
    categoria,
    Number(agregado._sum.valor ?? 0),
    agregado._count,
    orcamento ? { limite: Number(orcamento.limite) } : null,
  );
}
