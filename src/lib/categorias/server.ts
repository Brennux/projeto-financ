// Sem "server-only" de proposito: o worker do WhatsApp (processo Node puro,
// fora do Next) tambem usa este modulo, e "server-only" lanca erro fora do
// bundler do Next.
import { cache } from "react";
import prisma from "@/lib/prisma";
import type { RegraCategoria, Tipo } from "@/lib/parser/types";
import { normalize } from "@/lib/parser/normalize";
import { CATEGORIAS_PADRAO, CATEGORIA_FALLBACK } from "./padrao";
import type { CategoriaInfo } from "./types";

const SELECT = {
  id: true,
  nome: true,
  tipos: true,
  cor: true,
  icone: true,
  palavrasChave: true,
  sistema: true,
} as const;

async function garantirCategorias(householdId: string): Promise<void> {
  const existentes = await prisma.category.findMany({
    where: { householdId },
    select: { nome: true, sistema: true },
  });

  // Household novo (ou anterior as categorias personalizadas): cria as padrao.
  // skipDuplicates + @@unique([householdId, nome]) tornam isso seguro mesmo
  // com duas requisicoes chegando ao mesmo tempo.
  if (existentes.length === 0) {
    await prisma.category.createMany({
      data: CATEGORIAS_PADRAO.map((c, ordem) => ({
        ...c,
        householdId,
        ordem,
        sistema: c.nome === CATEGORIA_FALLBACK,
      })),
      skipDuplicates: true,
    });
    return;
  }

  // "Outros" e o fallback do parser -- precisa existir sempre.
  if (!existentes.some((c) => c.sistema)) {
    const padrao = CATEGORIAS_PADRAO.find((c) => c.nome === CATEGORIA_FALLBACK)!;
    await prisma.category.upsert({
      where: { householdId_nome: { householdId, nome: CATEGORIA_FALLBACK } },
      update: { sistema: true },
      create: { ...padrao, householdId, ordem: 999, sistema: true },
    });
  }
}

/**
 * Categorias do household, na ordem de avaliacao do parser ("Outros", o
 * fallback, sempre por ultimo). Cria as padrao na primeira chamada. cache() deduplica dentro de uma mesma requisicao
 * (layout + pagina pedem as duas).
 */
export const getCategorias = cache(async (householdId: string): Promise<CategoriaInfo[]> => {
  await garantirCategorias(householdId);
  return prisma.category.findMany({
    where: { householdId },
    select: SELECT,
    orderBy: [{ sistema: "asc" }, { ordem: "asc" }, { criadoEm: "asc" }],
  });
});

export async function regrasDoHousehold(householdId: string): Promise<RegraCategoria[]> {
  const categorias = await getCategorias(householdId);
  return categorias.map(({ nome, tipos, palavrasChave }) => ({ nome, tipos, palavrasChave }));
}

/**
 * Confere que a categoria existe no household e aceita o tipo. Retorna a
 * mensagem de erro (pra API devolver 400) ou null se estiver tudo certo.
 */
export async function validarCategoria(householdId: string, nome: string, tipo: Tipo): Promise<string | null> {
  const categoria = await prisma.category.findUnique({
    where: { householdId_nome: { householdId, nome } },
    select: { tipos: true },
  });
  if (!categoria) return "Categoria não encontrada.";
  if (!categoria.tipos.includes(tipo)) {
    return `A categoria ${nome} não aceita ${tipo === "despesa" ? "despesas" : "receitas"}.`;
  }
  return null;
}

/** Normaliza, remove vazios e duplicados -- e o formato que o parser compara. */
export function normalizarPalavrasChave(palavras: string[]): string[] {
  return [...new Set(palavras.map((p) => normalize(p)).filter(Boolean))];
}

/**
 * Renomeia a categoria e tudo que aponta pra ela pelo nome (transacoes,
 * orcamento, recorrencias), numa unica transacao.
 */
export async function renomearCategoria(householdId: string, nomeAntigo: string, nomeNovo: string): Promise<void> {
  if (nomeAntigo === nomeNovo) return;
  await prisma.$transaction([
    prisma.category.update({
      where: { householdId_nome: { householdId, nome: nomeAntigo } },
      data: { nome: nomeNovo },
    }),
    prisma.transaction.updateMany({ where: { householdId, categoria: nomeAntigo }, data: { categoria: nomeNovo } }),
    prisma.budget.updateMany({ where: { householdId, categoria: nomeAntigo }, data: { categoria: nomeNovo } }),
    prisma.recurringTransaction.updateMany({
      where: { householdId, categoria: nomeAntigo },
      data: { categoria: nomeNovo },
    }),
  ]);
}

/**
 * Exclui a categoria: transacoes e recorrencias dela passam pra "Outros"
 * (nada some do extrato) e o orcamento dela e removido.
 */
export async function excluirCategoria(householdId: string, nome: string): Promise<void> {
  await prisma.$transaction([
    prisma.transaction.updateMany({ where: { householdId, categoria: nome }, data: { categoria: CATEGORIA_FALLBACK } }),
    prisma.recurringTransaction.updateMany({
      where: { householdId, categoria: nome },
      data: { categoria: CATEGORIA_FALLBACK },
    }),
    prisma.budget.deleteMany({ where: { householdId, categoria: nome } }),
    prisma.category.delete({ where: { householdId_nome: { householdId, nome } } }),
  ]);
}

export async function contarUsoCategoria(householdId: string, nome: string): Promise<number> {
  return prisma.transaction.count({ where: { householdId, categoria: nome } });
}
