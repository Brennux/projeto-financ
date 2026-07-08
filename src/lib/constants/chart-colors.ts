import type { Categoria } from "./categorias";
import type { Tipo } from "@/lib/parser";

export interface CorTema {
  light: string;
  dark: string;
}

/**
 * Cores categoricas fixas (paleta validada contra CVD/contraste), uma por
 * categoria -- nunca geradas dinamicamente. "Outros" fica em cinza neutro
 * (e um bucket "resto", nao uma categoria com identidade propria). Verde e
 * reservado para o eixo receita (Salario + TIPO_COLORS.receita), pra ficar
 * consistente com "dinheiro entrando" em todo o dashboard.
 */
export const CATEGORIA_COLORS: Record<Categoria, CorTema> = {
  Mercado: { light: "#2a78d6", dark: "#3987e5" },
  Transporte: { light: "#1baf7a", dark: "#199e70" },
  Moradia: { light: "#eda100", dark: "#c98500" },
  "Saúde": { light: "#4a3aa7", dark: "#9085e9" },
  "Salário": { light: "#008300", dark: "#008300" },
  Lazer: { light: "#e87ba4", dark: "#d55181" },
  "Educação": { light: "#eb6834", dark: "#d95926" },
  Outros: { light: "#898781", dark: "#898781" },
};

export const TIPO_COLORS: Record<Tipo, CorTema> = {
  receita: { light: "#008300", dark: "#008300" },
  despesa: { light: "#e34948", dark: "#e66767" },
};

export const STATUS_COLORS = {
  good: { light: "#0ca30c", dark: "#0ca30c" },
  warning: { light: "#c98500", dark: "#e0a325" },
  critical: { light: "#d03b3b", dark: "#d03b3b" },
} satisfies Record<string, CorTema>;

export function corPorTema(cor: CorTema, tema: "light" | "dark" | undefined): string {
  return tema === "dark" ? cor.dark : cor.light;
}
