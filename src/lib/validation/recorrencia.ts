import { z } from "zod";
import { nomeCategoriaSchema, tipoSchema } from "./transaction";

export const recorrenciaInputSchema = z.object({
  tipo: tipoSchema,
  valor: z.coerce.number().positive("Informe um valor maior que zero").max(1_000_000),
  categoria: nomeCategoriaSchema,
  descricao: z.string().trim().min(1, "Descreva o lançamento (ex.: Aluguel)").max(80),
  diaDoMes: z.coerce.number().int().min(1, "Dia entre 1 e 31").max(31, "Dia entre 1 e 31"),
});

export type RecorrenciaInput = z.infer<typeof recorrenciaInputSchema>;
export type RecorrenciaFormInput = z.input<typeof recorrenciaInputSchema>;
