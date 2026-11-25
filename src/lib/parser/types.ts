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
  /** Valor TOTAL (num parcelamento, a soma das parcelas). */
  valor: number;
  categoria: string;
  descricao: string | null;
  /** Data da compra. */
  data: Date;
  /** Em quantas vezes ("em 10x"); 1 = a vista. */
  parcelas?: number;
  /** A mensagem fala em credito/cartao (sem necessariamente dizer qual). */
  noCredito?: boolean;
}

/** Como o parser enxerga uma categoria (do banco, por household, ou as padrao). */
export interface RegraCategoria {
  nome: string;
  tipos: Tipo[];
  /** Ja normalizadas (minusculas, sem acento). */
  palavrasChave: string[];
}
