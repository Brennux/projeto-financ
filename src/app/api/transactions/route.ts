import { NextResponse } from "next/server";
import { endOfMonth, startOfMonth } from "date-fns";
import prisma from "@/lib/prisma";
import { getOptionalSession } from "@/lib/auth/dal";
import { manualTransactionInputSchema } from "@/lib/validation/transaction";
import type { Prisma } from "@/generated/prisma";

export async function GET(request: Request) {
  const session = await getOptionalSession();
  if (!session) {
    return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const mes = searchParams.get("mes");
  const tipo = searchParams.get("tipo");
  const categoria = searchParams.get("categoria");

  const where: Prisma.TransactionWhereInput = { householdId: session.householdId };

  if (tipo === "despesa" || tipo === "receita") {
    where.tipo = tipo;
  }
  if (categoria) {
    where.categoria = categoria;
  }
  if (mes) {
    const inicio = startOfMonth(new Date(`${mes}-01T00:00:00`));
    where.data = { gte: inicio, lte: endOfMonth(inicio) };
  }

  try {
    const transacoes = await prisma.transaction.findMany({
      where,
      orderBy: [{ data: "desc" }, { criadoEm: "desc" }],
    });

    return NextResponse.json(transacoes.map((t) => ({ ...t, valor: Number(t.valor) })));
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erro ao buscar transações" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getOptionalSession();
  if (!session) {
    return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = manualTransactionInputSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos", detalhes: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const transacao = await prisma.transaction.create({
      data: {
        ...parsed.data,
        origem: "manual",
        householdId: session.householdId,
        userId: session.userId,
      },
    });
    return NextResponse.json({ ...transacao, valor: Number(transacao.valor) }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erro ao criar transação" }, { status: 500 });
  }
}
