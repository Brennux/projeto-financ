import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getOptionalSession } from "@/lib/auth/dal";
import { updateBudgetSchema } from "@/lib/validation/budget";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getOptionalSession();
  if (!session) {
    return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const parsed = updateBudgetSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos", detalhes: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const { count } = await prisma.budget.updateMany({
      where: { id, householdId: session.householdId },
      data: parsed.data,
    });
    if (count === 0) {
      return NextResponse.json({ error: "Orçamento não encontrado" }, { status: 404 });
    }
    const orcamento = await prisma.budget.findUniqueOrThrow({ where: { id } });
    return NextResponse.json({ ...orcamento, limite: Number(orcamento.limite) });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erro ao atualizar orçamento" }, { status: 400 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getOptionalSession();
  if (!session) {
    return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const { count } = await prisma.budget.deleteMany({
      where: { id, householdId: session.householdId },
    });
    if (count === 0) {
      return NextResponse.json({ error: "Orçamento não encontrado" }, { status: 404 });
    }
    return NextResponse.json({ message: "Orçamento excluído com sucesso" });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erro ao excluir orçamento" }, { status: 400 });
  }
}
