import { normalize } from "./normalize";
import { extractTipo } from "./tipo";
import { extractValor } from "./valor";
import { extractCategoria } from "./categoria";
import { extractData } from "./data";
import { extractDescricao } from "./descricao";
import type { ParsedTransaction } from "./types";

export type { ParsedTransaction, Tipo } from "./types";

/**
 * Interpreta uma mensagem de texto livre em uma transacao estruturada, sem
 * nenhuma chamada de IA — so regex + dicionario de palavras-chave.
 *
 * Regra de falha assimetrica: tipo e valor precisam ser reconhecidos com
 * confianca, ou a mensagem inteira falha (retorna null) — adivinhar errado
 * corromperia o extrato. categoria tem fallback seguro ("Outros").
 */
export function parseMessage(
  rawText: string,
  referenceDate: Date = new Date(),
): ParsedTransaction | null {
  const text = rawText.trim();
  if (!text) return null;

  const normalized = normalize(text);

  const tipoMatch = extractTipo(normalized);
  if (!tipoMatch) return null;

  const valorMatch = extractValor(text);
  if (!valorMatch) return null;

  const categoria = extractCategoria(normalized, tipoMatch.tipo);
  const data = extractData(normalized, referenceDate);
  const descricao = extractDescricao(text, tipoMatch.matchedKeyword, valorMatch.matchedRaw);

  return {
    tipo: tipoMatch.tipo,
    valor: valorMatch.valor,
    categoria,
    descricao,
    data,
  };
}
