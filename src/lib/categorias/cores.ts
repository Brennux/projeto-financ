/**
 * Paleta categorica FIXA das categorias. Sao os 8 tons da paleta de
 * referencia (validada pra daltonismo e contraste em claro/escuro) + cinza
 * neutro pra "Outros". Categoria personalizada escolhe uma dessas chaves --
 * nunca um hex livre nem uma cor gerada -- entao os graficos continuam
 * legiveis. Duas categorias podem repetir cor: o grafico de categorias
 * sempre mostra o nome ao lado da barra, entao cor nunca e a unica pista.
 */
export interface CorTema {
  light: string;
  dark: string;
}

export const CORES_CATEGORIA = {
  azul: { light: "#2a78d6", dark: "#3987e5" },
  laranja: { light: "#eb6834", dark: "#d95926" },
  agua: { light: "#1baf7a", dark: "#199e70" },
  amarelo: { light: "#eda100", dark: "#c98500" },
  magenta: { light: "#e87ba4", dark: "#d55181" },
  verde: { light: "#008300", dark: "#0ca30c" },
  violeta: { light: "#6250d6", dark: "#9085e9" },
  vermelho: { light: "#e34948", dark: "#e66767" },
  cinza: { light: "#898781", dark: "#898781" },
} as const satisfies Record<string, CorTema>;

export type CorCategoria = keyof typeof CORES_CATEGORIA;

export const CORES_CATEGORIA_ROTULO: Record<CorCategoria, string> = {
  azul: "Azul",
  laranja: "Laranja",
  agua: "Verde-água",
  amarelo: "Amarelo",
  magenta: "Rosa",
  verde: "Verde",
  violeta: "Violeta",
  vermelho: "Vermelho",
  cinza: "Cinza",
};

export const CHAVES_COR = Object.keys(CORES_CATEGORIA) as CorCategoria[];

export function corDaCategoria(chave: string): CorTema {
  return CORES_CATEGORIA[chave as CorCategoria] ?? CORES_CATEGORIA.cinza;
}
