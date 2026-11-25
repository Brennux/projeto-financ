import { z } from "zod";
import { nomeCategoriaSchema } from "./transaction";

// Se a categoria existe e aceita despesa (orcamento so faz sentido pra
// gasto) e conferido no servidor contra o banco -- as categorias agora sao
// personalizaveis por household.
const camposBudget = {
  categoria: nomeCategoriaSchema,
  limite: z.coerce.number().positive().max(1_000_000),
};

export const budgetInputSchema = z.object(camposBudget);

/** PATCH: só o limite muda -- a categoria é fixa após a criação. */
export const updateBudgetSchema = z.object({ limite: camposBudget.limite });

export type BudgetInput = z.infer<typeof budgetInputSchema>;
export type BudgetFormInput = z.input<typeof budgetInputSchema>;
export type UpdateBudgetInput = z.infer<typeof updateBudgetSchema>;
