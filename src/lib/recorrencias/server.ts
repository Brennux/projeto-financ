// Sem "server-only": o worker do WhatsApp tambem chama materializarRecorrencias.
import prisma from "@/lib/prisma";
import { avancarUmMes, hojeNoApp, inicioDoProximoMes, mesmoMes, proximaOcorrencia } from "./datas";

/** Teto de meses recuperados de uma vez (ex.: app ficou parado muito tempo). */
const MAX_MESES_ATRASADOS = 24;

/**
 * Cria as Transaction de toda recorrencia ativa cuja proximaData ja chegou
 * (incluindo meses atrasados) e avanca a proximaData. Idempotente e seguro
 * com chamadas simultaneas (app e worker ao mesmo tempo):
 *  - a proximaData so avanca se ainda for a que lemos (updateMany condicional);
 *  - @@unique([recorrenciaId, data]) + skipDuplicates impede ocorrencia duplicada.
 *
 * Sem householdId, processa todos (usado pelo worker de hora em hora).
 */
export async function materializarRecorrencias(householdId?: string): Promise<number> {
  const hoje = hojeNoApp();
  const pendentes = await prisma.recurringTransaction.findMany({
    where: { ativo: true, proximaData: { lte: hoje }, ...(householdId ? { householdId } : {}) },
  });

  let criadas = 0;
  for (const r of pendentes) {
    const datas: Date[] = [];
    let proxima = r.proximaData;
    while (proxima <= hoje && datas.length < MAX_MESES_ATRASADOS) {
      datas.push(proxima);
      proxima = avancarUmMes(proxima, r.diaDoMes);
    }
    if (proxima <= hoje) proxima = proximaOcorrencia(r.diaDoMes, hoje);

    criadas += await prisma.$transaction(async (tx) => {
      const avancou = await tx.recurringTransaction.updateMany({
        where: { id: r.id, proximaData: r.proximaData, ativo: true },
        data: { proximaData: proxima },
      });
      if (avancou.count === 0) return 0; // outra chamada ja processou

      const { count } = await tx.transaction.createMany({
        data: datas.map((data) => ({
          tipo: r.tipo,
          valor: r.valor,
          categoria: r.categoria,
          descricao: r.descricao,
          data,
          origem: "recorrente",
          householdId: r.householdId,
          userId: r.userId,
          recorrenciaId: r.id,
        })),
        skipDuplicates: true,
      });
      return count;
    });
  }
  return criadas;
}

/**
 * Proxima data a partir de hoje pra um dia do mes -- sem repetir o mes atual
 * se essa recorrencia ja gerou lancamento nele (ex.: mudou o dia de 5 pra 10
 * no dia 7, depois de ja ter lancado no dia 5).
 */
export async function calcularProximaData(diaDoMes: number, recorrenciaId?: string): Promise<Date> {
  const hoje = hojeNoApp();
  let base = hoje;
  if (recorrenciaId) {
    const ultima = await prisma.transaction.findFirst({
      where: { recorrenciaId },
      orderBy: { data: "desc" },
      select: { data: true },
    });
    if (ultima && mesmoMes(ultima.data, hoje)) base = inicioDoProximoMes(hoje);
  }
  return proximaOcorrencia(diaDoMes, base);
}
