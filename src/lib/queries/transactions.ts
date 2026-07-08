import { startOfMonth, endOfMonth, subMonths, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import prisma from "@/lib/prisma";
import type { Categoria } from "@/lib/constants/categorias";
import type { Tipo } from "@/lib/parser";

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

export interface CategoriaTotal {
  categoria: Categoria;
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
      categoria: l.categoria as Categoria,
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

export interface TransacaoResumida {
  id: string;
  tipo: Tipo;
  valor: number;
  categoria: string;
  descricao: string | null;
  data: Date;
  origem: string;
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
      ...(referenceDate ? { data: { gte: startOfMonth(referenceDate), lte: endOfMonth(referenceDate) } } : {}),
      ...(termo
        ? {
            OR: [
              { descricao: { contains: termo, mode: "insensitive" } },
              { categoria: { contains: termo, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: [{ data: "desc" }, { criadoEm: "desc" }],
    take: limite,
  });

  return linhas.map((l) => ({
    id: l.id,
    tipo: l.tipo,
    valor: Number(l.valor),
    categoria: l.categoria,
    descricao: l.descricao,
    data: l.data,
    origem: l.origem,
  }));
}
