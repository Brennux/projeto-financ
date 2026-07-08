import { z } from "zod";
import { CATEGORIAS, type Categoria } from "@/lib/constants/categorias";
import { CATEGORIA_RULES } from "@/lib/parser/dictionaries";

/** Categorias com sentido de limite mensal -- exclui as receita-only (ex. Salário). */
export const CATEGORIAS_ORCAVEIS: Categoria[] = CATEGORIAS.filter((categoria) =>
  CATEGORIA_RULES[categoria].tipos.includes("despesa"),
);
const CATEGORIAS_ORCAVEIS_SET = new Set<Categoria>(CATEGORIAS_ORCAVEIS);

const camposBudget = {
  categoria: z
    .enum(CATEGORIAS)
    .refine((categoria) => CATEGORIAS_ORCAVEIS_SET.has(categoria), {
      message: "Categoria não é elegível para orçamento",
    }),
  limite: z.coerce.number().positive().max(1_000_000),
};

export const budgetInputSchema = z.object(camposBudget);

/** PATCH: só o limite muda -- a categoria é fixa após a criação. */
export const updateBudgetSchema = z.object({ limite: camposBudget.limite });

export type BudgetInput = z.infer<typeof budgetInputSchema>;
export type BudgetFormInput = z.input<typeof budgetInputSchema>;
export type UpdateBudgetInput = z.infer<typeof updateBudgetSchema>;
