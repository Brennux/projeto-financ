"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { verifySession } from "@/lib/auth/dal";
import { validarCategoria } from "@/lib/categorias/server";
import { calcularProximaData, materializarRecorrencias } from "@/lib/recorrencias/server";
import { recorrenciaInputSchema, type RecorrenciaInput } from "@/lib/validation/recorrencia";
import type { ResultadoAcao } from "./categorias";

export async function salvarRecorrencia(id: string | null, input: RecorrenciaInput): Promise<ResultadoAcao> {
  const session = await verifySession();
  const parsed = recorrenciaInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, erro: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }
  const dados = parsed.data;

  const erroCategoria = await validarCategoria(session.householdId, dados.categoria, dados.tipo);
  if (erroCategoria) return { ok: false, erro: erroCategoria };

  if (id) {
    const existente = await prisma.recurringTransaction.findFirst({
      where: { id, householdId: session.householdId },
    });
    if (!existente) return { ok: false, erro: "Lançamento recorrente não encontrado." };

    const proximaData =
      existente.diaDoMes === dados.diaDoMes ? existente.proximaData : await calcularProximaData(dados.diaDoMes, id);
    await prisma.recurringTransaction.update({ where: { id }, data: { ...dados, proximaData } });
  } else {
    await prisma.recurringTransaction.create({
      data: {
        ...dados,
        householdId: session.householdId,
        userId: session.userId,
        proximaData: await calcularProximaData(dados.diaDoMes),
      },
    });
  }

  // Se o dia ja e hoje, o lancamento aparece na hora.
  await materializarRecorrencias(session.householdId);
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function alternarRecorrencia(id: string, ativo: boolean): Promise<ResultadoAcao> {
  const session = await verifySession();
  const existente = await prisma.recurringTransaction.findFirst({
    where: { id, householdId: session.householdId },
  });
  if (!existente) return { ok: false, erro: "Lançamento recorrente não encontrado." };

  // Reativar nao "cobra" os meses em que ficou pausado: recomeca da proxima data.
  await prisma.recurringTransaction.update({
    where: { id },
    data: { ativo, ...(ativo ? { proximaData: await calcularProximaData(existente.diaDoMes, id) } : {}) },
  });

  if (ativo) await materializarRecorrencias(session.householdId);
  revalidatePath("/", "layout");
  return { ok: true };
}

/** Os lancamentos ja gerados continuam no extrato -- so para de gerar novos. */
export async function excluirRecorrencia(id: string): Promise<ResultadoAcao> {
  const session = await verifySession();
  const { count } = await prisma.recurringTransaction.deleteMany({
    where: { id, householdId: session.householdId },
  });
  if (count === 0) return { ok: false, erro: "Lançamento recorrente não encontrado." };
  revalidatePath("/", "layout");
  return { ok: true };
}
