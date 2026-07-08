import { startOfDay, subDays } from "date-fns";

/**
 * referenceDate e parametro explicito (nunca "new Date()" aqui dentro) para
 * manter o parser puro e testavel sem depender do relogio da maquina.
 *
 * Atencao a ordem: "anteontem" contem "ontem" como substring, entao precisa
 * ser verificado primeiro.
 */
export function extractData(normalizedText: string, referenceDate: Date): Date {
  const base = startOfDay(referenceDate);
  if (normalizedText.includes("anteontem")) return subDays(base, 2);
  if (normalizedText.includes("ontem")) return subDays(base, 1);
  return base;
}
