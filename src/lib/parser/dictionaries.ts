import { CATEGORIAS_PADRAO } from "@/lib/categorias/padrao";
import type { RegraCategoria } from "./types";

/**
 * Regras usadas quando nao ha categorias do household a mao (testes, script
 * de debug). Em producao o bot passa as categorias do proprio household --
 * ver src/lib/categorias/server.ts (regrasDoHousehold).
 */
export const REGRAS_PADRAO: RegraCategoria[] = CATEGORIAS_PADRAO.map(({ nome, tipos, palavrasChave }) => ({
  nome,
  tipos,
  palavrasChave,
}));

// Palavras-chave ja comparadas contra texto normalizado (minusculas, sem
// acento) -- ver normalize.ts.
export const DESPESA_KEYWORDS = [
  "paguei",
  "pagamos",
  "gastei",
  "gastamos",
  "comprei",
  "compramos",
  "gasto de",
  "gasto com",
];

export const RECEITA_KEYWORDS = ["recebi", "recebemos", "ganhei", "ganhamos", "entrou", "caiu"];
