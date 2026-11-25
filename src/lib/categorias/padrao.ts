import type { Tipo } from "@/lib/parser/types";
import type { CorCategoria } from "./cores";
import type { IconeCategoria } from "./icones";

/** Fallback do parser -- categoria de sistema, nunca renomeada nem excluida. */
export const CATEGORIA_FALLBACK = "Outros";

export interface CategoriaPadrao {
  nome: string;
  tipos: Tipo[];
  cor: CorCategoria;
  icone: IconeCategoria;
  /** Ja normalizadas (minusculas, sem acento) -- ver src/lib/parser/normalize.ts. */
  palavrasChave: string[];
}

/**
 * Categorias criadas pra todo household novo (e pros antigos, na primeira
 * vez que o app carrega depois da migracao). A ORDEM importa: o parser usa a
 * primeira categoria cujas palavras-chave aparecem na mensagem.
 *
 * Nao incluir palavras-chave puramente numericas (ex. "99", o app de
 * transporte) -- colidem com o proprio valor, ja que toda mensagem tem um numero.
 */
export const CATEGORIAS_PADRAO: CategoriaPadrao[] = [
  {
    nome: "Mercado",
    tipos: ["despesa"],
    cor: "azul",
    icone: "carrinho",
    palavrasChave: ["mercado", "supermercado", "feira", "hortifruti", "padaria", "acougue"],
  },
  {
    nome: "Transporte",
    tipos: ["despesa"],
    cor: "agua",
    icone: "carro",
    palavrasChave: ["uber", "gasolina", "combustivel", "onibus", "metro", "taxi", "estacionamento"],
  },
  {
    nome: "Moradia",
    tipos: ["despesa"],
    cor: "amarelo",
    icone: "casa",
    palavrasChave: ["aluguel", "condominio", "luz", "energia", "agua", "internet", "gas"],
  },
  {
    nome: "Saúde",
    tipos: ["despesa"],
    cor: "violeta",
    icone: "saude",
    palavrasChave: ["farmacia", "remedio", "medico", "consulta", "dentista", "plano de saude"],
  },
  {
    nome: "Salário",
    tipos: ["receita"],
    cor: "verde",
    icone: "carteira",
    palavrasChave: ["salario", "pagamento", "freela", "freelance", "bonus", "decimo terceiro"],
  },
  {
    nome: "Assinaturas",
    tipos: ["despesa"],
    cor: "violeta",
    icone: "tv",
    palavrasChave: ["assinatura", "streaming", "netflix", "spotify", "disney", "prime video", "hbo", "icloud"],
  },
  {
    nome: "Lazer",
    tipos: ["despesa"],
    cor: "magenta",
    icone: "pipoca",
    palavrasChave: ["cinema", "bar", "barzinho", "show", "viagem", "passeio"],
  },
  {
    nome: "Restaurante",
    tipos: ["despesa"],
    cor: "vermelho",
    icone: "talheres",
    palavrasChave: ["restaurante", "lanchonete", "lanche", "ifood", "pizza", "hamburguer", "almoco", "jantar", "delivery"],
  },
  {
    nome: "Educação",
    tipos: ["despesa"],
    cor: "laranja",
    icone: "educacao",
    palavrasChave: ["curso", "livro", "faculdade", "escola", "mensalidade"],
  },
  {
    nome: "Pets",
    tipos: ["despesa"],
    cor: "laranja",
    icone: "pata",
    palavrasChave: ["pet", "petshop", "racao", "veterinario", "banho e tosa"],
  },
  {
    nome: "Vestuário",
    tipos: ["despesa"],
    cor: "magenta",
    icone: "camisa",
    palavrasChave: ["roupa", "sapato", "tenis", "camisa", "calca", "vestido"],
  },
  {
    nome: CATEGORIA_FALLBACK,
    tipos: ["despesa", "receita"],
    cor: "cinza",
    icone: "outros",
    palavrasChave: [],
  },
];
