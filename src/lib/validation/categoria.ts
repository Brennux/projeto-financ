import { z } from "zod";
import { CHAVES_COR, type CorCategoria } from "@/lib/categorias/cores";
import { CHAVES_ICONE, type IconeCategoria } from "@/lib/categorias/icones";
import { tipoSchema } from "./transaction";

export const categoriaInputSchema = z.object({
  nome: z.string().trim().min(1, "Dê um nome pra categoria").max(30, "Use no máximo 30 caracteres"),
  tipos: z.array(tipoSchema).min(1, "Escolha despesa, receita ou as duas"),
  cor: z.enum(CHAVES_COR as [CorCategoria, ...CorCategoria[]]),
  icone: z.enum(CHAVES_ICONE as [IconeCategoria, ...IconeCategoria[]]),
  palavrasChave: z.array(z.string().trim().max(40)).max(50, "Use no máximo 50 palavras-chave"),
});

export type CategoriaInput = z.infer<typeof categoriaInputSchema>;
