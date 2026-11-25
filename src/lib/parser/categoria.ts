import { CATEGORIA_FALLBACK } from "@/lib/categorias/padrao";
import { normalize } from "./normalize";
import type { RegraCategoria, Tipo } from "./types";

function escapeRegex(texto: string): string {
  return texto.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Palavra (ou expressao) inteira, aceitando plural -- "remedio" casa com
 * "remedios", mas "casa" nao casa com "casamento" e "gas" nao casa com
 * "gastei" (antes era substring, e toda mensagem com "gastei" sem outra
 * palavra-chave caia em Moradia). Texto e termos ja vem sem acento.
 */
export function contemPalavra(texto: string, palavra: string): boolean {
  return new RegExp(`(^|[^a-z0-9])${escapeRegex(palavra)}(s|es)?($|[^a-z0-9])`).test(texto);
}

/**
 * Unico campo com fallback seguro: categorizar errado e um incomodo pequeno
 * e facil de corrigir depois (pelo app ou mandando "desfazer"), nao um
 * problema de integridade dos dados (ao contrario de tipo/valor, que fazem a
 * mensagem inteira falhar).
 *
 * Duas passadas, nessa ordem:
 *  1. o NOME de alguma categoria aparece na mensagem ("gastei 50 em pets")
 *     -- e o sinal mais explicito, entao uma categoria personalizada
 *     ("Farmácia") vence a padrao que tem aquela palavra-chave (Saúde);
 *  2. a primeira categoria (na ordem) com alguma palavra-chave no texto.
 */
export function extractCategoria(normalizedText: string, tipo: Tipo, regras: RegraCategoria[]): string {
  const aplicaveis = regras.filter((regra) => regra.tipos.includes(tipo));

  const porNome = aplicaveis.find((regra) => {
    const nome = normalize(regra.nome);
    return nome.length > 0 && contemPalavra(normalizedText, nome);
  });
  if (porNome) return porNome.nome;

  const porPalavraChave = aplicaveis.find((regra) =>
    regra.palavrasChave.some((termo) => termo.length > 0 && contemPalavra(normalizedText, termo)),
  );
  return porPalavraChave?.nome ?? CATEGORIA_FALLBACK;
}
