import type { Categoria } from "@/lib/constants/categorias";
import type { Tipo } from "./types";

interface CategoriaRule {
  tipos: Tipo[];
  keywords: string[];
}

// Chaves e palavras-chave abaixo já são comparadas contra texto normalizado
// (minúsculas, sem acento) — ver normalize.ts. Para adicionar uma categoria
// nova, basta um item aqui + uma entrada em CATEGORIAS (src/lib/constants).
//
// Nota: não incluir palavras-chave puramente numéricas (ex. "99", o app de
// transporte) — colidem com o próprio valor da transação, já que toda
// mensagem tem um número.
export const CATEGORIA_RULES: Record<Categoria, CategoriaRule> = {
  Mercado: {
    tipos: ["despesa"],
    keywords: ["mercado", "supermercado", "feira", "hortifruti", "padaria", "acougue"],
  },
  Transporte: {
    tipos: ["despesa"],
    keywords: ["uber", "gasolina", "combustivel", "onibus", "metro", "taxi", "estacionamento"],
  },
  Moradia: {
    tipos: ["despesa"],
    keywords: ["aluguel", "condominio", "luz", "energia", "agua", "internet", "gas"],
  },
  "Saúde": {
    tipos: ["despesa"],
    keywords: ["farmacia", "remedio", "medico", "consulta", "dentista", "plano de saude"],
  },
  "Salário": {
    tipos: ["receita"],
    keywords: ["salario", "pagamento", "freela", "freelance", "bonus", "decimo terceiro"],
  },
  Lazer: {
    tipos: ["despesa"],
    keywords: ["cinema", "bar", "show", "streaming", "netflix", "viagem", "passeio"],
  },
  "Educação": {
    tipos: ["despesa"],
    keywords: ["curso", "livro", "faculdade", "escola", "mensalidade"],
  },
  Outros: {
    tipos: ["despesa", "receita"],
    keywords: [],
  },
};

export const DESPESA_KEYWORDS = [
  "paguei",
  "pagamos",
  "gastei",
  "gastamos",
  "comprei",
  "compramos",
  "gasto de",
  "gasto com",
];

export const RECEITA_KEYWORDS = ["recebi", "recebemos", "ganhei", "ganhamos", "entrou", "caiu"];
