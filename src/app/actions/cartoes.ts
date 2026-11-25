"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@/generated/prisma";
import prisma from "@/lib/prisma";
import { verifySession } from "@/lib/auth/dal";
import { lerMesDaFatura } from "@/lib/cartoes/fatura";
import { cartaoInputSchema, type CartaoInput } from "@/lib/validation/cartao";
import type { ResultadoAcao } from "./categorias";

export async function salvarCartao(id: string | null, input: CartaoInput): Promise<ResultadoAcao> {
  const session = await verifySession();
  const parsed = cartaoInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, erro: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  try {
    if (id) {
      const { count } = await prisma.creditCard.updateMany({
        where: { id, householdId: session.householdId },
        data: parsed.data,
      });
      if (count === 0) return { ok: false, erro: "Cartão não encontrado." };
    } else {
      await prisma.creditCard.create({ data: { ...parsed.data, householdId: session.householdId } });
    }
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return { ok: false, erro: "Já existe um cartão com esse nome." };
    }
    throw err;
  }

  revalidatePath("/", "layout");
  return { ok: true };
}

/** Arquivar tira o cartao dos formularios e do bot, mas mantem todo o historico. */
export async function arquivarCartao(id: string, arquivar: boolean): Promise<ResultadoAcao> {
  const session = await verifySession();
  const { count } = await prisma.creditCard.updateMany({
    where: { id, householdId: session.householdId },
    data: { ativo: !arquivar },
  });
  if (count === 0) return { ok: false, erro: "Cartão não encontrado." };
  revalidatePath("/", "layout");
  return { ok: true };
}

/** So da pra excluir cartao sem lancamentos -- com historico, o caminho e arquivar. */
export async function excluirCartao(id: string): Promise<ResultadoAcao> {
  const session = await verifySession();
  const cartao = await prisma.creditCard.findFirst({
    where: { id, householdId: session.householdId },
    select: { _count: { select: { transactions: true } } },
  });
  if (!cartao) return { ok: false, erro: "Cartão não encontrado." };
  if (cartao._count.transactions > 0) {
    return { ok: false, erro: "Esse cartão tem lançamentos. Arquive em vez de excluir, pra manter o histórico." };
  }
  await prisma.creditCard.delete({ where: { id } });
  revalidatePath("/", "layout");
  return { ok: true };
}

/**
 * Marca (ou desmarca) a fatura como paga. Nao cria despesa: o gasto ja foi
 * contado compra a compra -- pagar so libera o limite e muda o status.
 */
export async function marcarFaturaPaga(cartaoId: string, mesTexto: string, paga: boolean): Promise<ResultadoAcao> {
  const session = await verifySession();
  const mes = lerMesDaFatura(mesTexto);
  if (!mes) return { ok: false, erro: "Fatura inválida." };
  const cartao = await prisma.creditCard.findFirst({ where: { id: cartaoId, householdId: session.householdId } });
  if (!cartao) return { ok: false, erro: "Cartão não encontrado." };

  if (paga) {
    await prisma.faturaPaga.upsert({
      where: { cartaoId_mes: { cartaoId, mes } },
      update: {},
      create: { cartaoId, mes, userId: session.userId },
    });
  } else {
    await prisma.faturaPaga.deleteMany({ where: { cartaoId, mes } });
  }
  revalidatePath("/", "layout");
  return { ok: true };
}
