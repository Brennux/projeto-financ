import { z } from "zod";
import { CATEGORIAS } from "@/lib/constants/categorias";

export const tipoSchema = z.enum(["despesa", "receita"]);

const camposTransacao = {
  tipo: tipoSchema,
  valor: z.coerce.number().positive().max(1_000_000),
  categoria: z.enum(CATEGORIAS),
  descricao: z.string().trim().nullable(),
  data: z.coerce.date(),
};

/**
 * Valida a saida do parser antes de gravar no banco -- rede de seguranca
 * barata mesmo sem IA no meio do caminho (parser tem bug -> um valor
 * negativo/zero nunca chega ao Prisma).
 */
export const parsedTransactionSchema = z.object(camposTransacao);

/**
 * Usado tanto pela API (POST) quanto pelo formulario manual do dashboard --
 * uma unica regra de validacao para as duas origens de dado.
 */
export const manualTransactionInputSchema = z.object(camposTransacao);

/** PATCH: qualquer subconjunto dos campos acima. */
export const updateTransactionSchema = manualTransactionInputSchema.partial();

export type ParsedTransactionInput = z.infer<typeof parsedTransactionSchema>;

/** Formato de saida (valor: number, data: Date) -- o que chega depois do parse/coerce. */
export type ManualTransactionInput = z.infer<typeof manualTransactionInputSchema>;
/** Formato de entrada do formulario (antes do coerce do Zod) -- usado pelo useForm. */
export type ManualTransactionFormInput = z.input<typeof manualTransactionInputSchema>;

export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;
