/**
 * Datas de recorrencia sempre como meia-noite UTC do dia (o mesmo formato
 * que uma coluna @db.Date devolve) -- sem fuso no meio, "dia 5" e dia 5.
 */

const FUSO_DO_APP = "America/Sao_Paulo";

function diasNoMes(ano: number, mes: number): number {
  return new Date(Date.UTC(ano, mes + 1, 0)).getUTCDate();
}

/** Dia `dia` do mes, limitado ao ultimo dia (31 em fevereiro -> 28/29). */
export function dataNoMes(ano: number, mes: number, dia: number): Date {
  return new Date(Date.UTC(ano, mes, Math.min(dia, diasNoMes(ano, mes))));
}

/** "Hoje" no fuso do app (Brasil), como meia-noite UTC -- o servidor roda em UTC. */
export function hojeNoApp(agora: Date = new Date()): Date {
  const ymd = new Intl.DateTimeFormat("en-CA", {
    timeZone: FUSO_DO_APP,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(agora);
  return new Date(`${ymd}T00:00:00Z`);
}

/** Primeira ocorrencia do `diaDoMes` em `aPartirDe` ou depois (mesmo mes se ainda nao passou). */
export function proximaOcorrencia(diaDoMes: number, aPartirDe: Date): Date {
  const ano = aPartirDe.getUTCFullYear();
  const mes = aPartirDe.getUTCMonth();
  const nesteMes = dataNoMes(ano, mes, diaDoMes);
  return nesteMes >= aPartirDe ? nesteMes : dataNoMes(ano, mes + 1, diaDoMes);
}

/** Mesma recorrencia, um mes depois (respeitando o dia original, nao o limitado). */
export function avancarUmMes(data: Date, diaDoMes: number): Date {
  return dataNoMes(data.getUTCFullYear(), data.getUTCMonth() + 1, diaDoMes);
}

/** Primeiro dia do mes seguinte -- pra nao gerar de novo no mes que ja teve ocorrencia. */
export function inicioDoProximoMes(data: Date): Date {
  return new Date(Date.UTC(data.getUTCFullYear(), data.getUTCMonth() + 1, 1));
}

export function mesmoMes(a: Date, b: Date): boolean {
  return a.getUTCFullYear() === b.getUTCFullYear() && a.getUTCMonth() === b.getUTCMonth();
}
