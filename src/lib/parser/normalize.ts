const COMBINING_DIACRITICS = new RegExp("[\\u0300-\\u036f]", "g");

/** Minusculas + sem acento (teclado de celular costuma derrubar o acento). */
export function normalize(text: string): string {
  return text.normalize("NFD").replace(COMBINING_DIACRITICS, "").toLowerCase().trim();
}
