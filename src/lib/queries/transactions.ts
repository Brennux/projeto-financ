import { startOfMonth, endOfMonth, subMonths, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import prisma from "@/lib/prisma";
import type { Tipo } from "@/lib/parser";
import { transacaoCasa } from "@/lib/busca/correspondencia";

/** Quantas transacoes recentes entram numa busca por texto. */
const JANELA_BUSCA = 5000;

export interface ResumoMensal {
  receitas: number;
  despesas: number;
  saldo: number;
}

export async function getResumoMensal(
  householdId: string,
  referenceDate: Date = new Date(),
): Promise<ResumoMensal> {
  const inicio = startOfMonth(referenceDate);
  const fim = endOfMonth(referenceDate);

  const linhas = await prisma.transaction.groupBy({
    by: ["tipo"],
    where: { householdId, data: { gte: inicio, lte: fim } },
    _sum: { valor: true },
  });

  const receitas = Number(linhas.find((l) => l.tipo === "receita")?._sum.valor ?? 0);
  const despesas = Number(linhas.find((l) => l.tipo === "despesa")?._sum.valor ?? 0);

  return { receitas, despesas, saldo: receitas - despesas };
}

/**
 * Saldo acumulado do mes, dia a dia (entradas - saidas ate aquele dia), do
 * dia 1 ate hoje -- ou ate o fim do mes, se for um mes que ja passou. Usado
 * na mini-linha do card de saldo.
 */
export async function getSaldoDiario(householdId: string, referenceDate: Date = new Date()): Promise<number[]> {
  const inicio = startOfMonth(referenceDate);
  const fim = endOfMonth(referenceDate);
  const hoje = new Date();
  const ultimoDia = fim < hoje ? fim.getDate() : hoje < inicio ? 0 : hoje.getDate();

  const linhas = await prisma.transaction.groupBy({
    by: ["data", "tipo"],
    where: { householdId, data: { gte: inicio, lte: fim } },
    _sum: { valor: true },
  });

  // @db.Date volta como meia-noite UTC -- o dia certo e o getUTCDate().
  const variacaoPorDia = new Map<number, number>();
  for (const l of linhas) {
    const dia = l.data.getUTCDate();
    const valor = Number(l._sum.valor ?? 0) * (l.tipo === "receita" ? 1 : -1);
    variacaoPorDia.set(dia, (variacaoPorDia.get(dia) ?? 0) + valor);
  }

  const saldos: number[] = [];
  let acumulado = 0;
  for (let dia = 1; dia <= ultimoDia; dia++) {
    acumulado += variacaoPorDia.get(dia) ?? 0;
    saldos.push(acumulado);
  }
  return saldos;
}

export interface CategoriaTotal {
  categoria: string;
  total: number;
}

export async function getDespesasPorCategoria(
  householdId: string,
  referenceDate: Date = new Date(),
): Promise<CategoriaTotal[]> {
  const inicio = startOfMonth(referenceDate);
  const fim = endOfMonth(referenceDate);

  const linhas = await prisma.transaction.groupBy({
    by: ["categoria"],
    where: { householdId, tipo: "despesa", data: { gte: inicio, lte: fim } },
    _sum: { valor: true },
    orderBy: { _sum: { valor: "desc" } },
  });

  return linhas
    .filter((l) => Number(l._sum.valor ?? 0) > 0)
    .map((l) => ({
      categoria: l.categoria,
      total: Number(l._sum.valor ?? 0),
    }));
}

export interface PontoTendencia {
  mes: string;
  despesas: number;
  receitas: number;
}

export async function getTendenciaMensal(
  householdId: string,
  referenceDate: Date = new Date(),
  meses: number = 6,
): Promise<PontoTendencia[]> {
  const inicio = startOfMonth(subMonths(referenceDate, meses - 1));
  const fim = endOfMonth(referenceDate);

  const transacoes = await prisma.transaction.findMany({
    where: { householdId, data: { gte: inicio, lte: fim } },
    select: { tipo: true, valor: true, data: true },
  });

  const baldes = new Map<string, { despesas: number; receitas: number }>();
  for (let i = 0; i < meses; i++) {
    const chave = format(subMonths(referenceDate, meses - 1 - i), "yyyy-MM");
    baldes.set(chave, { despesas: 0, receitas: 0 });
  }

  for (const t of transacoes) {
    const chave = format(t.data, "yyyy-MM");
    const balde = baldes.get(chave);
    if (!balde) continue;
    const valor = Number(t.valor);
    if (t.tipo === "despesa") balde.despesas += valor;
    else balde.receitas += valor;
  }

  return Array.from(baldes.entries()).map(([chave, valores]) => ({
    mes: format(new Date(`${chave}-01T00:00:00`), "MMM/yy", { locale: ptBR }),
    ...valores,
  }));
}

export interface AutorTransacao {
  id: string;
  nome: string;
}

export interface TransacaoResumida {
  id: string;
  tipo: Tipo;
  valor: number;
  categoria: string;
  descricao: string | null;
  data: Date;
  origem: string;
  /** Quem lancou (null se a pessoa saiu do household ou foi lancamento antigo sem autor). */
  autor: AutorTransacao | null;
  /** Cartao de credito (a `data` acima e o vencimento da fatura). */
  cartao: { id: string; nome: string; cor: string } | null;
  /** Data real da compra (cartao/parcelado); null = a propria `data`. */
  dataCompra: Date | null;
  parcelamentoId: string | null;
  parcelaNumero: number | null;
  parcelaTotal: number | null;
}

export async function getTransacoesRecentes(
  householdId: string,
  limite: number = 8,
  referenceDate?: Date,
  busca?: string,
): Promise<TransacaoResumida[]> {
  const termo = busca?.trim();

  const linhas = await prisma.transaction.findMany({
    where: {
      householdId,
      // Sem mes escolhido: ate o fim do mes atual -- parcelas futuras (que
      // vencem nos proximos meses) aparecem quando se escolhe o mes delas.
      // Excecao: compra no cartao JA FEITA aparece mesmo que conte numa
      // fatura futura (senao a pessoa lanca e "nao ve" o lancamento) --
      // so a 1a parcela, as outras continuam no mes delas.
      ...(referenceDate
        ? { data: { gte: startOfMonth(referenceDate), lte: endOfMonth(referenceDate) } }
        : {
            OR: [
              { data: { lte: endOfMonth(new Date()) } },
              { dataCompra: { lte: new Date() }, OR: [{ parcelaNumero: null }, { parcelaNumero: 1 }] },
            ],
          }),
    },
    include: {
      user: { select: { id: true, nome: true } },
      cartao: { select: { id: true, nome: true, cor: true } },
    },
    orderBy: [{ data: "desc" }, { criadoEm: "desc" }],
    // Com busca, o filtro e feito aqui no codigo (sem acento, por valor,
    // data ou pessoa -- ver correspondencia.ts), entao traz uma janela maior.
    take: termo ? Math.max(limite, JANELA_BUSCA) : limite,
  });

  const encontradas = termo
    ? linhas.filter((l) => transacaoCasa({ ...l, valor: Number(l.valor), autor: l.user }, termo)).slice(0, limite)
    : linhas;

  return encontradas.map((l) => ({
    id: l.id,
    tipo: l.tipo,
    valor: Number(l.valor),
    categoria: l.categoria,
    descricao: l.descricao,
    data: l.data,
    origem: l.origem,
    autor: l.user,
    cartao: l.cartao,
    dataCompra: l.dataCompra,
    parcelamentoId: l.parcelamentoId,
    parcelaNumero: l.parcelaNumero,
    parcelaTotal: l.parcelaTotal,
  }));
}

export interface GastoPorPessoa {
  /** null = lancamentos sem autor (antigos, ou de quem saiu do household). */
  userId: string | null;
  nome: string;
  total: number;
}

/**
 * Despesas do mes por membro do household -- todos os membros aparecem
 * (com 0 se nao gastaram), na ordem de entrada no household, pra cor de
 * cada pessoa ser estavel entre meses.
 */
export async function getGastosPorPessoa(
  householdId: string,
  referenceDate: Date = new Date(),
): Promise<GastoPorPessoa[]> {
  const [membros, linhas] = await Promise.all([
    prisma.user.findMany({
      where: { householdId },
      select: { id: true, nome: true },
      orderBy: { criadoEm: "asc" },
    }),
    prisma.transaction.groupBy({
      by: ["userId"],
      where: {
        householdId,
        tipo: "despesa",
        data: { gte: startOfMonth(referenceDate), lte: endOfMonth(referenceDate) },
      },
      _sum: { valor: true },
    }),
  ]);

  const totalPorUsuario = new Map(linhas.map((l) => [l.userId, Number(l._sum.valor ?? 0)]));
  const resultado: GastoPorPessoa[] = membros.map((m) => ({
    userId: m.id,
    nome: m.nome,
    total: totalPorUsuario.get(m.id) ?? 0,
  }));

  const semAutor = totalPorUsuario.get(null) ?? 0;
  if (semAutor > 0) resultado.push({ userId: null, nome: "Sem autor", total: semAutor });
  return resultado;
}
