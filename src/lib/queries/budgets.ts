import prisma from "@/lib/prisma";
import type { Categoria } from "@/lib/constants/categorias";
import { getDespesasPorCategoria } from "./transactions";

export interface Orcamento {
  id: string;
  categoria: Categoria;
  limite: number;
}

export async function getOrcamentos(householdId: string): Promise<Orcamento[]> {
  const linhas = await prisma.budget.findMany({
    where: { householdId },
    orderBy: { categoria: "asc" },
  });

  return linhas.map((l) => ({
    id: l.id,
    categoria: l.categoria as Categoria,
    limite: Number(l.limite),
  }));
}

export type StatusOrcamento = "good" | "warning" | "critical";

export interface OrcamentoComGasto {
  id: string;
  categoria: Categoria;
  limite: number;
  gasto: number;
  percentual: number;
  status: StatusOrcamento;
}

function statusPorPercentual(percentual: number): StatusOrcamento {
  if (percentual >= 1) return "critical";
  if (percentual >= 0.8) return "warning";
  return "good";
}

export async function getOrcamentosComGasto(
  householdId: string,
  referenceDate: Date = new Date(),
): Promise<OrcamentoComGasto[]> {
  const [orcamentos, despesas] = await Promise.all([
    getOrcamentos(householdId),
    getDespesasPorCategoria(householdId, referenceDate),
  ]);

  const gastoPorCategoria = new Map(despesas.map((d) => [d.categoria, d.total]));

  return orcamentos.map((o) => {
    const gasto = gastoPorCategoria.get(o.categoria) ?? 0;
    const percentual = gasto / o.limite;
    return { ...o, gasto, percentual, status: statusPorPercentual(percentual) };
  });
}
