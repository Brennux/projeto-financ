import { normalize } from "@/lib/parser/normalize";
import { contemPalavra } from "@/lib/parser/categoria";

export const PERGUNTAR_CARTAO = "perguntar" as const;

/**
 * De qual cartao e a compra mandada pelo WhatsApp:
 *  - o nome de um cartao aparece na mensagem ("no nubank") -> esse;
 *  - fala em credito/cartao ou em parcelas, sem dizer qual: se so ha um
 *    cartao, e ele; se ha varios, pergunta (adivinhar mandaria o gasto pra
 *    fatura errada);
 *  - nada disso -> sem cartao (dinheiro, debito, Pix -- ou carne, se parcelado
 *    e nao houver cartao nenhum cadastrado).
 */
export function escolherCartao<T extends { nome: string }>(
  textoNormalizado: string,
  cartoes: T[],
  pistas: { noCredito: boolean; parcelas: number },
): T | null | typeof PERGUNTAR_CARTAO {
  const citados = cartoes
    .filter((c) => {
      const nome = normalize(c.nome);
      return nome.length > 0 && contemPalavra(textoNormalizado, nome);
    })
    // "Nubank Ultravioleta" ganha de "Nubank" quando os dois aparecem.
    .sort((a, b) => b.nome.length - a.nome.length);
  if (citados.length > 0) return citados[0];

  const pareceCartao = pistas.noCredito || pistas.parcelas > 1;
  if (!pareceCartao || cartoes.length === 0) return null;
  if (cartoes.length === 1) return cartoes[0];
  return PERGUNTAR_CARTAO;
}
