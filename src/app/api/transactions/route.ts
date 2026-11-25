import { NextResponse } from "next/server";
import { endOfMonth, startOfMonth } from "date-fns";
import prisma from "@/lib/prisma";
import { getOptionalSession } from "@/lib/auth/dal";
import { manualTransactionInputSchema } from "@/lib/validation/transaction";
import { validarCategoria } from "@/lib/categorias/server";
import { getCartao, registrarLancamento } from "@/lib/cartoes/server";
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

  const erroCategoria = await validarCategoria(session.householdId, parsed.data.categoria, parsed.data.tipo);
  if (erroCategoria) {
    return NextResponse.json({ error: erroCategoria }, { status: 400 });
  }

  const { cartaoId, parcelas = 1, ...campos } = parsed.data;
  const cartao = cartaoId ? await getCartao(session.householdId, cartaoId) : null;
  if (cartaoId && (!cartao || !cartao.ativo)) {
    return NextResponse.json({ error: "Cartão não encontrado." }, { status: 400 });
  }
  if (campos.tipo === "receita" && parcelas > 1) {
    return NextResponse.json({ error: "Receita não pode ser parcelada." }, { status: 400 });
  }

  try {
    const criadas = await registrarLancamento({
      householdId: session.householdId,
      userId: session.userId,
      tipo: campos.tipo,
      valorTotal: campos.valor,
      categoria: campos.categoria,
      descricao: campos.descricao,
      dataCompra: campos.data,
      parcelas,
      cartao,
      origem: "manual",
    });
    return NextResponse.json({ parcelas: criadas.length, primeiraData: criadas[0]?.data }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erro ao criar transação" }, { status: 500 });
  }
}
