export const CATEGORIAS = [
  "Mercado",
  "Transporte",
  "Moradia",
  "Saúde",
  "Salário",
  "Lazer",
  "Educação",
  "Outros",
] as const;

export type Categoria = (typeof CATEGORIAS)[number];
