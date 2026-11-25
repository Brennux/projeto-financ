import type { Tipo } from "@/lib/parser";
import type { CorTema } from "@/lib/categorias/cores";

export type { CorTema };

// Cores por categoria: src/lib/categorias/cores.ts (categorias sao
// personalizaveis, cada uma guarda a chave da sua cor).

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
