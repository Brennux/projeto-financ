/**
 * Opera sobre o texto ORIGINAL (nao normalizado), para preservar
 * maiusculas/acentos na exibicao. As palavras-chave de tipo (paguei, gastei,
 * recebi...) nao tem acento, entao remove-las do texto original com
 * comparacao case-insensitive e seguro.
 */
export function extractDescricao(
  originalText: string,
  matchedTipoKeyword: string,
  matchedValorRaw: string,
): string | null {
  let texto = originalText;

  if (matchedTipoKeyword) {
    texto = texto.replace(new RegExp(matchedTipoKeyword, "i"), "");
  }
  if (matchedValorRaw) {
    texto = texto.replace(matchedValorRaw, "");
  }

  texto = texto.replace(/\s+/g, " ").trim();
  return texto.length > 0 ? texto : null;
}
