import { z } from "zod";

export const tipoSchema = z.enum(["despesa", "receita"]);

/**
 * So o formato -- se a categoria existe no household (e aceita o tipo) e
 * conferido no servidor contra o banco (validarCategoria), ja que as
 * categorias agora sao personalizaveis.
 */
export const nomeCategoriaSchema = z.string().trim().min(1, "Escolha uma categoria").max(40);

const camposTransacao = {
  tipo: tipoSchema,
  valor: z.coerce.number().positive().max(1_000_000),
  categoria: nomeCategoriaSchema,
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
 * uma unica regra de validacao para as duas origens de dado. Na criacao da
 * pra escolher o cartao e parcelar; `data` e a data da COMPRA (no cartao, o
 * servidor calcula em que fatura cada parcela cai).
 */
export const manualTransactionInputSchema = z.object({
  ...camposTransacao,
  cartaoId: z.string().min(1).nullable().optional(),
  parcelas: z.coerce.number().int().min(1).max(48).optional(),
});

/**
 * PATCH: qualquer subconjunto dos campos basicos. Cartao e parcelas nao
 * mudam na edicao (mudariam as datas de todas as parcelas) -- pra isso,
 * exclui e lanca de novo.
 */
export const updateTransactionSchema = z.object(camposTransacao).partial();

export type ParsedTransactionInput = z.infer<typeof parsedTransactionSchema>;

/** Formato de saida (valor: number, data: Date) -- o que chega depois do parse/coerce. */
export type ManualTransactionInput = z.infer<typeof manualTransactionInputSchema>;
/** Formato de entrada do formulario (antes do coerce do Zod) -- usado pelo useForm. */
export type ManualTransactionFormInput = z.input<typeof manualTransactionInputSchema>;

export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;
