import type { Categoria } from "@/lib/constants/categorias";

export type Tipo = "despesa" | "receita";

export interface TipoMatch {
  tipo: Tipo;
  matchedKeyword: string;
}

export interface ValorMatch {
  valor: number;
  matchedRaw: string;
}

export interface ParsedTransaction {
  tipo: Tipo;
  valor: number;
  categoria: Categoria;
  descricao: string | null;
  data: Date;
}
