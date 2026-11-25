import { z } from "zod";
import { CHAVES_COR, type CorCategoria } from "@/lib/categorias/cores";

const dia = (rotulo: string) =>
  z.coerce.number().int().min(1, `${rotulo}: dia entre 1 e 31`).max(31, `${rotulo}: dia entre 1 e 31`);

export const cartaoInputSchema = z
  .object({
    nome: z.string().trim().min(1, "Dê um nome pro cartão (ex.: Nubank)").max(30, "Use no máximo 30 caracteres"),
    cor: z.enum(CHAVES_COR as [CorCategoria, ...CorCategoria[]]),
    limite: z.coerce.number().positive("O limite precisa ser maior que zero").max(10_000_000).nullable(),
    diaFechamento: dia("Fechamento"),
    diaVencimento: dia("Vencimento"),
  })
  .refine((c) => c.diaFechamento !== c.diaVencimento, {
    message: "O dia de vencimento precisa ser diferente do dia de fechamento",
    path: ["diaVencimento"],
  });

export type CartaoInput = z.infer<typeof cartaoInputSchema>;

/** Ate quantas parcelas o app aceita (os bancos costumam ir ate 24x; carne pode ir alem). */
export const MAX_PARCELAS = 48;
