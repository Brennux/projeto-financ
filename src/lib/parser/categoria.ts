import type { Categoria } from "@/lib/constants/categorias";
import type { Tipo } from "./types";
import { CATEGORIA_RULES } from "./dictionaries";

/**
 * Unico campo com fallback seguro: categorizar errado e um incomodo pequeno
 * e facil de corrigir depois pelo dashboard, nao um problema de integridade
 * dos dados (ao contrario de tipo/valor, que fazem a mensagem inteira falhar).
 */
export function extractCategoria(normalizedText: string, tipo: Tipo): Categoria {
  for (const categoria of Object.keys(CATEGORIA_RULES) as Categoria[]) {
    const rule = CATEGORIA_RULES[categoria];
    if (!rule.tipos.includes(tipo)) continue;
    if (rule.keywords.some((kw) => normalizedText.includes(kw))) {
      return categoria;
    }
  }
  return "Outros";
}
