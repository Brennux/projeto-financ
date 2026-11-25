import { normalize } from "./normalize";
import { extractTipo } from "./tipo";
import { extractValor } from "./valor";
import { extractCategoria } from "./categoria";
import { extractData } from "./data";
import { extractDescricao } from "./descricao";
import { extractParcelas, mencionaCredito } from "./parcelas";
import { REGRAS_PADRAO } from "./dictionaries";
import type { ParsedTransaction, RegraCategoria } from "./types";

export type { ParsedTransaction, RegraCategoria, Tipo } from "./types";

/**
 * Interpreta uma mensagem de texto livre em uma transacao estruturada, sem
 * nenhuma chamada de IA — so regex + dicionario de palavras-chave.
 *
 * Regra de falha assimetrica: tipo e valor precisam ser reconhecidos com
 * confianca, ou a mensagem inteira falha (retorna null) — adivinhar errado
 * corromperia o extrato. categoria tem fallback seguro ("Outros").
 *
 * `regras` sao as categorias do household (personalizaveis); sem elas, usa
 * as categorias padrao.
 */
export function parseMessage(
  rawText: string,
  referenceDate: Date = new Date(),
  regras: RegraCategoria[] = REGRAS_PADRAO,
): ParsedTransaction | null {
  const textoCompleto = rawText.trim();
  if (!textoCompleto) return null;

  const normalizadoCompleto = normalize(textoCompleto);

  const tipoMatch = extractTipo(normalizadoCompleto);
  if (!tipoMatch) return null;

  // Parcelamento sai do texto antes de ler o valor: "em 10x" nao pode virar
  // o valor 10, e nem entrar na descricao. Normalizado e original tem o mesmo
  // tamanho (o normalize so tira acento), entao os indices valem pros dois.
  const parcelasMatch = tipoMatch.tipo === "despesa" ? extractParcelas(normalizadoCompleto) : null;
  const text = parcelasMatch
    ? `${textoCompleto.slice(0, parcelasMatch.inicio)} ${textoCompleto.slice(parcelasMatch.fim)}`.trim()
    : textoCompleto;
  const normalized = normalize(text);

  const valorMatch = extractValor(text);
  // "10x de 120": o valor dito e o da parcela -- o total e parcelas x valor.
  const valor = parcelasMatch?.valorParcela
    ? Math.round(parcelasMatch.parcelas * parcelasMatch.valorParcela * 100) / 100
    : valorMatch?.valor;
  if (!valor) return null;

  const categoria = extractCategoria(normalized, tipoMatch.tipo, regras);
  const data = extractData(normalized, referenceDate);
  const descricao = extractDescricao(text, tipoMatch.matchedKeyword, valorMatch?.matchedRaw ?? "");

  return {
    tipo: tipoMatch.tipo,
    valor,
    categoria,
    descricao,
    data,
    parcelas: parcelasMatch?.parcelas ?? 1,
    noCredito: mencionaCredito(normalizadoCompleto),
  };
}
