import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getOptionalSession } from "@/lib/auth/dal";
import { budgetInputSchema } from "@/lib/validation/budget";

export async function GET() {
  const session = await getOptionalSession();
  if (!session) {
    return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });
  }

  try {
    const orcamentos = await prisma.budget.findMany({
      where: { householdId: session.householdId },
      orderBy: { categoria: "asc" },
    });

    return NextResponse.json(orcamentos.map((o) => ({ ...o, limite: Number(o.limite) })));
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erro ao buscar orçamentos" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getOptionalSession();
  if (!session) {
    return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = budgetInputSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos", detalhes: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const orcamento = await prisma.budget.upsert({
      where: {
        householdId_categoria: {
          householdId: session.householdId,
          categoria: parsed.data.categoria,
        },
      },
      update: { limite: parsed.data.limite },
      create: { ...parsed.data, householdId: session.householdId },
    });
    return NextResponse.json({ ...orcamento, limite: Number(orcamento.limite) }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erro ao salvar orçamento" }, { status: 500 });
  }
}
