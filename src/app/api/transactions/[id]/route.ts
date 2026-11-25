import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getOptionalSession } from "@/lib/auth/dal";
import { updateTransactionSchema } from "@/lib/validation/transaction";
import { validarCategoria } from "@/lib/categorias/server";

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

  const atual = await prisma.transaction.findFirst({
    where: { id, householdId: session.householdId },
    select: { categoria: true, tipo: true, cartaoId: true, parcelamentoId: true },
  });
  if (!atual) {
    return NextResponse.json({ error: "Transação não encontrada" }, { status: 404 });
  }

  // Categoria e tipo finais (o PATCH pode mudar so um dos dois) precisam
  // combinar: a categoria tem que existir e aceitar o tipo.
  const erroCategoria = await validarCategoria(
    session.householdId,
    parsed.data.categoria ?? atual.categoria,
    parsed.data.tipo ?? atual.tipo,
  );
  if (erroCategoria) {
    return NextResponse.json({ error: erroCategoria }, { status: 400 });
  }

  const dados = { ...parsed.data };
  // No cartao/parcelado, a data e o vencimento da fatura de cada parcela --
  // nao se edita (pra mudar, exclui e lanca de novo).
  if (atual.cartaoId || atual.parcelamentoId) delete dados.data;
  if (atual.parcelamentoId && dados.tipo && dados.tipo !== atual.tipo) {
    return NextResponse.json({ error: "Não dá pra mudar o tipo de uma compra parcelada." }, { status: 400 });
  }

  // ?escopo=todas: descricao e categoria valem pra todas as parcelas; o
  // valor continua sendo so desta parcela.
  const todasAsParcelas = new URL(request.url).searchParams.get("escopo") === "todas" && atual.parcelamentoId;

  try {
    if (todasAsParcelas) {
      const { valor, ...comuns } = dados;
      await prisma.$transaction([
        prisma.transaction.updateMany({
          where: { parcelamentoId: atual.parcelamentoId, householdId: session.householdId },
          data: comuns,
        }),
        ...(valor !== undefined ? [prisma.transaction.update({ where: { id }, data: { valor } })] : []),
      ]);
    } else {
      await prisma.transaction.update({ where: { id }, data: dados });
    }
    const transacao = await prisma.transaction.findUniqueOrThrow({ where: { id } });
    return NextResponse.json({ ...transacao, valor: Number(transacao.valor) });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erro ao atualizar transação" }, { status: 400 });
  }
}

/** ?escopo=todas apaga a compra parcelada inteira (todas as parcelas). */
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getOptionalSession();
  if (!session) {
    return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });
  }

  const { id } = await params;
  const todasAsParcelas = new URL(request.url).searchParams.get("escopo") === "todas";

  try {
    const atual = await prisma.transaction.findFirst({
      where: { id, householdId: session.householdId },
      select: { parcelamentoId: true },
    });
    if (!atual) {
      return NextResponse.json({ error: "Transação não encontrada" }, { status: 404 });
    }
    const { count } = await prisma.transaction.deleteMany({
      where:
        todasAsParcelas && atual.parcelamentoId
          ? { parcelamentoId: atual.parcelamentoId, householdId: session.householdId }
          : { id, householdId: session.householdId },
    });
    return NextResponse.json({ message: "Transação excluída com sucesso", excluidas: count });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erro ao excluir transação" }, { status: 400 });
  }
}
