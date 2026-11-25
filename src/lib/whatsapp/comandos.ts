import { normalize } from "@/lib/parser/normalize";
import { contemPalavra } from "@/lib/parser/categoria";
import type { RegraCategoria } from "@/lib/parser/types";

export type Comando =
  | { tipo: "ajuda" }
  | { tipo: "desfazer" }
  | { tipo: "saldo"; mesPassado: boolean }
  | { tipo: "resumo"; mesPassado: boolean }
  /** "quanto gastei com mercado" -- termo null = total de despesas do mes. */
  | { tipo: "quanto"; termo: string | null; mesPassado: boolean }
  /** "fatura", "fatura do nubank" -- termo = nome do cartao (null = todos). */
  | { tipo: "fatura"; termo: string | null };

// "fatura", "faturas", "fatura do nubank", "minha fatura", "cartao", "cartoes"
const PERGUNTA_FATURA = /^(?:minhas?\s+|nossas?\s+|qual\s+(?:a\s+)?|ver\s+(?:a\s+)?)?(?:faturas?|cartao|cartoes)(?:\s+(?:do|da|de|no|na)\s+(.+))?$/;

const AJUDA = new Set(["ajuda", "help", "comandos", "menu", "oi", "ola", "opcoes"]);
const DESFAZER = new Set([
  "desfazer",
  "desfaz",
  "desfazer ultimo",
  "apagar",
  "apaga",
  "apagar ultimo",
  "apaga o ultimo",
  "apagar o ultimo",
  "cancelar",
  "cancela",
  "errei",
]);
const SALDO = new Set(["saldo", "meu saldo", "nosso saldo", "saldo do mes"]);
const RESUMO = new Set(["resumo", "resumo do mes", "extrato", "relatorio"]);

const MES_PASSADO = /\b(do |no |n?esse |n?este )?mes passado\b/;
const ESTE_MES = /\b(do |no |n?esse |n?este )mes\b|\bhoje\b/;

const PERGUNTA_QUANTO = /^(?:quanto|qto|qnto|qt)\s+(?:eu\s+|a gente\s+|nos\s+)?(?:gastei|gastamos|gastou|gasto|foi gasto)\b(.*)$/;
const PERGUNTA_GASTOS = /^(?:gastos?|despesas?)\s+(?:com|de|em|no|na|nos|nas)\s+(.+)$/;
const PREPOSICAO_INICIAL = /^(?:com|de|em|no|na|nos|nas|do|da|dos|das)\s+/;

function limpar(texto: string): string {
  return normalize(texto)
    .replace(/[?!.,;:]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Tira "mes passado"/"este mes" e a preposicao do comeco: " com mercado esse mes" -> "mercado". */
function extrairTermo(resto: string): string | null {
  const termo = resto
    .replace(MES_PASSADO, " ")
    .replace(ESTE_MES, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(PREPOSICAO_INICIAL, "")
    .trim();
  return termo.length > 0 ? termo : null;
}

/**
 * Reconhece os comandos do bot. So casa quando a mensagem INTEIRA e um
 * comando (nunca "apagar" no meio de uma frase) e, para as perguntas de
 * gasto, sem nenhum numero -- "gasto com mercado 50" continua sendo um
 * lancamento, nao uma consulta.
 */
export function detectarComando(textoOriginal: string): Comando | null {
  const texto = limpar(textoOriginal);
  if (!texto) return null;

  if (AJUDA.has(texto)) return { tipo: "ajuda" };
  if (DESFAZER.has(texto)) return { tipo: "desfazer" };

  const fatura = texto.match(PERGUNTA_FATURA);
  if (fatura) return { tipo: "fatura", termo: fatura[1]?.trim() || null };

  const mesPassado = MES_PASSADO.test(texto);
  const semMes = texto.replace(MES_PASSADO, "").replace(/\s+/g, " ").trim();
  if (SALDO.has(semMes)) return { tipo: "saldo", mesPassado };
  if (RESUMO.has(semMes)) return { tipo: "resumo", mesPassado };

  if (/\d/.test(texto)) return null;

  const quanto = texto.match(PERGUNTA_QUANTO);
  if (quanto) return { tipo: "quanto", termo: extrairTermo(quanto[1]), mesPassado };

  const gastos = texto.match(PERGUNTA_GASTOS);
  if (gastos) return { tipo: "quanto", termo: extrairTermo(gastos[1]), mesPassado };

  return null;
}

/** "mercado" -> "Mercado"; aceita o nome da categoria ou uma palavra-chave dela ("uber" -> Transporte). */
export function encontrarCategoria(termo: string, regras: RegraCategoria[]): string | null {
  const alvo = normalize(termo);
  const exata = regras.find((r) => normalize(r.nome) === alvo);
  if (exata) return exata.nome;
  const parecida = regras.find(
    (r) => contemPalavra(alvo, normalize(r.nome)) || r.palavrasChave.some((p) => contemPalavra(alvo, p)),
  );
  return parecida?.nome ?? null;
}
