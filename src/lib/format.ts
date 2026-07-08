const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: "UTC",
});

export function formatCurrencyBRL(valor: number): string {
  return currencyFormatter.format(valor);
}

/** timeZone UTC porque `data` no banco e um @db.Date (sem hora, meia-noite UTC). */
export function formatDatePtBr(data: Date): string {
  return dateFormatter.format(data);
}
