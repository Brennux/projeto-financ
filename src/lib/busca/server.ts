import prisma from "@/lib/prisma";
import { getCategorias } from "@/lib/categorias/server";
import { casaTexto, casaValor, transacaoCasa } from "./correspondencia";

/** Quantas transacoes recentes entram na busca (um household tem poucas centenas por mes). */
const JANELA_TRANSACOES = 3000;
const LIMITE = { transacoes: 6, categorias: 4, recorrentes: 4, orcamentos: 4, pessoas: 4 };

export interface ResultadoBusca {
  transacoes: {
    id: string;
    descricao: string | null;
    categoria: string;
    valor: number;
    tipo: "despesa" | "receita";
    data: string;
    autor: string | null;
  }[];
  /** Total de transacoes que casaram (a lista acima mostra so as primeiras). */
  totalTransacoes: number;
  categorias: { id: string; nome: string; cor: string; icone: string }[];
  recorrentes: { id: string; descricao: string; categoria: string; valor: number; tipo: "despesa" | "receita"; diaDoMes: number }[];
  orcamentos: { id: string; categoria: string; limite: number }[];
  pessoas: { id: string; nome: string }[];
}

export const RESULTADO_VAZIO: ResultadoBusca = {
  transacoes: [],
  totalTransacoes: 0,
  categorias: [],
  recorrentes: [],
  orcamentos: [],
  pessoas: [],
};

/**
 * Busca em tudo do household de uma vez. O casamento e feito aqui no codigo
 * (correspondencia.ts), nao no SQL: o Postgres nao ignora acento sem a
 * extensao unaccent, e "saude" precisa achar "Saúde".
 */
export async function buscarNoSistema(householdId: string, termo: string): Promise<ResultadoBusca> {
  if (!termo.trim()) return RESULTADO_VAZIO;

  const [linhas, categorias, recorrentes, orcamentos, membros] = await Promise.all([
    prisma.transaction.findMany({
      where: { householdId },
      include: { user: { select: { nome: true } }, cartao: { select: { nome: true } } },
      orderBy: [{ data: "desc" }, { criadoEm: "desc" }],
      take: JANELA_TRANSACOES,
    }),
    getCategorias(householdId),
    prisma.recurringTransaction.findMany({ where: { householdId }, orderBy: { diaDoMes: "asc" } }),
    prisma.budget.findMany({ where: { householdId }, orderBy: { categoria: "asc" } }),
    prisma.user.findMany({ where: { householdId }, select: { id: true, nome: true }, orderBy: { criadoEm: "asc" } }),
  ]);

  const transacoes = linhas.filter((l) =>
    transacaoCasa({ ...l, valor: Number(l.valor), autor: l.user, cartao: l.cartao }, termo),
  );

  return {
    transacoes: transacoes.slice(0, LIMITE.transacoes).map((l) => ({
      id: l.id,
      descricao: l.descricao,
      categoria: l.categoria,
      valor: Number(l.valor),
      tipo: l.tipo,
      data: l.data.toISOString(),
      autor: l.user?.nome ?? null,
    })),
    totalTransacoes: transacoes.length,
    categorias: categorias
      .filter((c) => casaTexto([c.nome, ...c.palavrasChave], termo))
      .slice(0, LIMITE.categorias)
      .map(({ id, nome, cor, icone }) => ({ id, nome, cor, icone })),
    recorrentes: recorrentes
      .filter((r) => casaValor(Number(r.valor), termo) || casaTexto([r.descricao, r.categoria, "recorrente"], termo))
      .slice(0, LIMITE.recorrentes)
      .map((r) => ({
        id: r.id,
        descricao: r.descricao,
        categoria: r.categoria,
        valor: Number(r.valor),
        tipo: r.tipo,
        diaDoMes: r.diaDoMes,
      })),
    orcamentos: orcamentos
      .filter((o) => casaTexto([o.categoria, "orcamento limite"], termo))
      .slice(0, LIMITE.orcamentos)
      .map((o) => ({ id: o.id, categoria: o.categoria, limite: Number(o.limite) })),
    pessoas: membros.filter((m) => casaTexto([m.nome], termo)).slice(0, LIMITE.pessoas),
  };
}
