import { DESPESA_KEYWORDS, RECEITA_KEYWORDS } from "./dictionaries";
import type { TipoMatch } from "./types";

function findKeyword(normalizedText: string, keywords: string[]): string | null {
  return keywords.find((kw) => normalizedText.includes(kw)) ?? null;
}

/**
 * Sem default seguro: se nenhuma palavra-chave bater, ou as duas baterem ao
 * mesmo tempo (mensagem contraditoria), a extracao falha (null) em vez de
 * adivinhar despesa/receita.
 */
export function extractTipo(normalizedText: string): TipoMatch | null {
  const despesaMatch = findKeyword(normalizedText, DESPESA_KEYWORDS);
  const receitaMatch = findKeyword(normalizedText, RECEITA_KEYWORDS);

  if (receitaMatch && !despesaMatch) return { tipo: "receita", matchedKeyword: receitaMatch };
  if (despesaMatch && !receitaMatch) return { tipo: "despesa", matchedKeyword: despesaMatch };
  return null;
}
