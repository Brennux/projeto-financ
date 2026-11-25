import { extractValor } from "./valor";

export interface ParcelasMatch {
  parcelas: number;
  /** Valor de CADA parcela, quando a mensagem diz ("10x de 120"). */
  valorParcela: number | null;
  /** Posicao do trecho no texto (normalizado e original tem o mesmo tamanho). */
  inicio: number;
  fim: number;
}

const MAX_PARCELAS = 48;

// "em 10x", "10 x", "em 10 vezes", "10x de 120", "10x de R$ 120,00"
const PARCELAS_X = /(?:\bem\s+)?\b(\d{1,2})\s*(?:x|vezes)\b(?:\s+de\s+(r\$\s*)?(\d[\d.,]*\d|\d))?/;
// "parcelado em 10", "parcelada em 10 vezes"
const PARCELADO_EM = /\bparcelad[oa]s?\s+em\s+(\d{1,2})\b(?:\s*(?:x|vezes)\b)?/;

/**
 * Le o parcelamento da mensagem (texto ja normalizado: minusculo, sem
 * acento). null quando nao fala em parcelas -- ou fala em 1x/"a vista".
 */
export function extractParcelas(normalizedText: string): ParcelasMatch | null {
  const porX = normalizedText.match(PARCELAS_X);
  const porParcelado = normalizedText.match(PARCELADO_EM);
  const match = porX ?? porParcelado;
  if (!match || match.index === undefined) return null;

  const parcelas = Number(match[1]);
  if (!Number.isInteger(parcelas) || parcelas < 2 || parcelas > MAX_PARCELAS) return null;

  const valorParcela = porX && match === porX && match[3] ? (extractValor(match[3])?.valor ?? null) : null;
  return { parcelas, valorParcela, inicio: match.index, fim: match.index + match[0].length };
}

/** "no credito", "no cartao", "credito" -- a pessoa avisou que foi no cartao (sem dizer qual). */
export function mencionaCredito(normalizedText: string): boolean {
  return /\b(credito|cartao|cartoes)\b/.test(normalizedText);
}
