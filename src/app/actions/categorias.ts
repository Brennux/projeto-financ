"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { verifySession } from "@/lib/auth/dal";
import { excluirCategoria, normalizarPalavrasChave, renomearCategoria } from "@/lib/categorias/server";
import { normalize } from "@/lib/parser/normalize";
import type { Tipo } from "@/lib/parser/types";
import { categoriaInputSchema, type CategoriaInput } from "@/lib/validation/categoria";

export type ResultadoAcao = { ok: true } | { ok: false; erro: string };

const ROTULO_TIPO: Record<Tipo, string> = { despesa: "despesas", receita: "receitas" };

export async function salvarCategoria(id: string | null, input: CategoriaInput): Promise<ResultadoAcao> {
  const session = await verifySession();
  const parsed = categoriaInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, erro: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const { nome, tipos, cor, icone } = parsed.data;
  const palavrasChave = normalizarPalavrasChave(parsed.data.palavrasChave);
  const householdId = session.householdId;

  const categorias = await prisma.category.findMany({ where: { householdId } });
  const existente = id ? categorias.find((c) => c.id === id) : undefined;
  if (id && !existente) return { ok: false, erro: "Categoria não encontrada." };

  const outras = categorias.filter((c) => c.id !== id);

  if (outras.some((c) => normalize(c.nome) === normalize(nome))) {
    return { ok: false, erro: "Já existe uma categoria com esse nome." };
  }

  // Palavra-chave em duas categorias deixaria o bot ambiguo (a primeira na
  // ordem sempre venceria, sem o usuario entender por que).
  for (const palavra of palavrasChave) {
    const dona = outras.find((c) => c.palavrasChave.includes(palavra));
    if (dona) return { ok: false, erro: `A palavra-chave "${palavra}" já está na categoria ${dona.nome}.` };
  }

  if (existente?.sistema) {
    if (nome !== existente.nome) return { ok: false, erro: `A categoria ${existente.nome} não pode ser renomeada.` };
    if (tipos.length !== 2) return { ok: false, erro: `A categoria ${existente.nome} precisa aceitar despesas e receitas.` };
  }

  // Tirar um tipo que ja tem lancamentos deixaria transacoes "invalidas".
  if (existente) {
    for (const tipo of existente.tipos.filter((t) => !tipos.includes(t))) {
      const [emUso, recorrentes] = await Promise.all([
        prisma.transaction.count({ where: { householdId, categoria: existente.nome, tipo } }),
        prisma.recurringTransaction.count({ where: { householdId, categoria: existente.nome, tipo } }),
      ]);
      if (emUso > 0 || recorrentes > 0) {
        return {
          ok: false,
          erro: `Essa categoria tem ${ROTULO_TIPO[tipo]} lançadas. Mude a categoria delas antes de tirar esse tipo.`,
        };
      }
      if (tipo === "despesa") {
        await prisma.budget.deleteMany({ where: { householdId, categoria: existente.nome } });
      }
    }
  }

  if (existente) {
    await renomearCategoria(householdId, existente.nome, nome);
    await prisma.category.update({ where: { id: existente.id }, data: { tipos, cor, icone, palavrasChave } });
  } else {
    const ordem = Math.max(0, ...categorias.map((c) => c.ordem)) + 1;
    await prisma.category.create({ data: { householdId, nome, tipos, cor, icone, palavrasChave, ordem } });
  }

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function excluirCategoriaAction(id: string): Promise<ResultadoAcao> {
  const session = await verifySession();
  const categoria = await prisma.category.findFirst({ where: { id, householdId: session.householdId } });
  if (!categoria) return { ok: false, erro: "Categoria não encontrada." };
  if (categoria.sistema) return { ok: false, erro: `A categoria ${categoria.nome} não pode ser excluída.` };

  await excluirCategoria(session.householdId, categoria.nome);
  revalidatePath("/", "layout");
  return { ok: true };
}
