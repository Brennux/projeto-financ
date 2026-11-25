import { normalize } from "@/lib/parser/normalize";

/**
 * Regras de "isso casa com o que a pessoa digitou", iguais em todo o app
 * (busca global, pagina de transacoes, filtro da tabela):
 *  - sem diferenca de acento e maiuscula ("saude" acha "Saúde");
 *  - todas as palavras digitadas precisam aparecer, em qualquer ordem
 *    ("mercado ana" acha o mercado lancado pela Ana);
 *  - um termo que e so numero/valor ("50", "58,90", "R$ 1.200") casa com o
 *    valor do lancamento.
 */

export function palavrasDaBusca(termo: string): string[] {
  return normalize(termo)
    .split(/\s+/)
    .map((p) => p.trim())
    .filter(Boolean);
}

/** Todas as palavras do termo aparecem em algum dos textos. */
export function casaTexto(textos: (string | null | undefined)[], termo: string): boolean {
  const palavras = palavrasDaBusca(termo);
  if (palavras.length === 0) return true;
  const alvo = normalize(textos.filter(Boolean).join(" "));
  return palavras.every((p) => alvo.includes(p));
}

/**
 * Le um valor em reais do termo ("50", "58,90", "1.234,56", "R$ 120").
 * null quando o termo nao e so um valor.
 */
export function valorDaBusca(termo: string): { valor: number; temCentavos: boolean } | null {
  const limpo = termo.trim().replace(/^r\$\s*/i, "");
  let numero: string;
  let temCentavos: boolean;

  if (/^\d{1,3}(\.\d{3})*,\d{1,2}$/.test(limpo) || /^\d+,\d{1,2}$/.test(limpo)) {
    // Padrao brasileiro: ponto = milhar, virgula = centavos ("1.234,56", "58,90").
    numero = limpo.replace(/\./g, "").replace(",", ".");
    temCentavos = true;
  } else if (/^\d{1,3}(\.\d{3})+$/.test(limpo)) {
    // So milhar, sem centavos ("1.200").
    numero = limpo.replace(/\./g, "");
    temCentavos = false;
  } else if (/^\d+\.\d{1,2}$/.test(limpo)) {
    // Ponto decimal, como o teclado numerico do celular manda ("58.90").
    numero = limpo;
    temCentavos = true;
  } else if (/^\d+$/.test(limpo)) {
    numero = limpo;
    temCentavos = false;
  } else {
    return null;
  }

  const valor = Number(numero);
  return valor > 0 ? { valor, temCentavos } : null;
}

/** "50" casa com 50,00 ate 50,99; "50,90" casa so com 50,90. */
export function casaValor(valor: number, termo: string): boolean {
  const buscado = valorDaBusca(termo);
  if (!buscado) return false;
  if (buscado.temCentavos) return Math.abs(valor - buscado.valor) < 0.005;
  return valor >= buscado.valor && valor < buscado.valor + 1;
}

export interface TransacaoBuscavel {
  descricao: string | null;
  categoria: string;
  valor: number;
  data: Date;
  tipo: "despesa" | "receita";
  origem?: string;
  autor?: { nome: string } | null;
  cartao?: { nome: string } | null;
}

const dataCurta = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC" });

/** Uma transacao casa pelo texto (descricao, categoria, quem lancou, tipo, data) ou pelo valor. */
export function transacaoCasa(t: TransacaoBuscavel, termo: string): boolean {
  if (!termo.trim()) return true;
  if (casaValor(t.valor, termo)) return true;
  return casaTexto(
    [
      t.descricao,
      t.categoria,
      t.autor?.nome,
      t.cartao ? `${t.cartao.nome} cartao credito` : null,
      t.tipo,
      t.origem === "whatsapp" ? "whatsapp" : t.origem,
      dataCurta.format(t.data),
    ],
    termo,
  );
}

/**
 * Onde destacar a primeira palavra buscada dentro do texto original. Como o
 * normalize so tira acentos de letras ja compostas, os indices batem com o
 * texto original. null quando nao ha o que destacar.
 */
export function trechoDestacado(texto: string, termo: string): { antes: string; meio: string; depois: string } | null {
  const palavras = palavrasDaBusca(termo);
  const alvo = normalize(texto);
  if (alvo.length !== texto.length) return null;
  for (const p of palavras) {
    const i = alvo.indexOf(p);
    if (i >= 0) return { antes: texto.slice(0, i), meio: texto.slice(i, i + p.length), depois: texto.slice(i + p.length) };
  }
  return null;
}
