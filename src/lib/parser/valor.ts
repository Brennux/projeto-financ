import type { ValorMatch } from "./types";

const VALOR_COM_PREFIXO = new RegExp("r\\$\\s*(\\d[\\d.,]*\\d|\\d)", "i");
const VALOR_SEM_PREFIXO = new RegExp("(\\d[\\d.,]*\\d|\\d)");

const VALOR_MAXIMO = 1_000_000;

function parseNumericToken(raw: string): number | null {
  let s = raw.trim();
  const hasComma = s.includes(",");
  const hasDot = s.includes(".");

  if (hasComma && hasDot) {
    // O separador que aparece por ultimo no texto e o decimal; o outro e
    // separador de milhar (cobre tanto "1.234,56" quanto "1,234.56").
    const lastComma = s.lastIndexOf(",");
    const lastDot = s.lastIndexOf(".");
    if (lastComma > lastDot) {
      s = s.replace(/\./g, "").replace(",", ".");
    } else {
      s = s.replace(/,/g, "");
    }
  } else if (hasComma) {
    // Virgula como separador decimal e o padrao brasileiro.
    s = s.replace(",", ".");
  } else if (hasDot) {
    const digitosAposPonto = s.length - s.lastIndexOf(".") - 1;
    if (digitosAposPonto >= 3) {
      // Ponto como separador de milhar (ex: "1.234" -> 1234).
      s = s.replace(/\./g, "");
    }
    // Com 1-2 digitos apos o ponto, ja esta no formato decimal certo.
  }

  const value = Number(s);
  return Number.isFinite(value) ? value : null;
}

/**
 * Sem default seguro: nenhum valor reconhecido (ou fora da faixa aceitavel)
 * faz a extracao inteira falhar, em vez de assumir um valor.
 *
 * Limitacao conhecida: mensagens com mais de um numero (ex. "58,90 em 2
 * parcelas") sao ambiguas — a v1 usa o primeiro numero encontrado.
 */
export function extractValor(text: string): ValorMatch | null {
  const match = text.match(VALOR_COM_PREFIXO) ?? text.match(VALOR_SEM_PREFIXO);
  if (!match) return null;

  const value = parseNumericToken(match[1]);
  if (value === null || value <= 0 || value > VALOR_MAXIMO) return null;

  return { valor: Math.round(value * 100) / 100, matchedRaw: match[0] };
}
