import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getOptionalSession } from "@/lib/auth/dal";
import { updateTransactionSchema } from "@/lib/validation/transaction";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getOptionalSession();
  if (!session) {
    return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const parsed = updateTransactionSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos", detalhes: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const { count } = await prisma.transaction.updateMany({
      where: { id, householdId: session.householdId },
      data: parsed.data,
    });
    if (count === 0) {
      return NextResponse.json({ error: "Transação não encontrada" }, { status: 404 });
    }
    const transacao = await prisma.transaction.findUniqueOrThrow({ where: { id } });
    return NextResponse.json({ ...transacao, valor: Number(transacao.valor) });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erro ao atualizar transação" }, { status: 400 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getOptionalSession();
  if (!session) {
    return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const { count } = await prisma.transaction.deleteMany({
      where: { id, householdId: session.householdId },
    });
    if (count === 0) {
      return NextResponse.json({ error: "Transação não encontrada" }, { status: 404 });
    }
    return NextResponse.json({ message: "Transação excluída com sucesso" });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erro ao excluir transação" }, { status: 400 });
  }
}
