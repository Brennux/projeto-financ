import { describe, expect, it } from "vitest";
import { normalize } from "@/lib/parser/normalize";
import { escolherCartao, PERGUNTAR_CARTAO } from "../escolha";

const NUBANK = { nome: "Nubank" };
const INTER = { nome: "Inter" };
const escolher = (texto: string, cartoes: { nome: string }[], noCredito = false, parcelas = 1) =>
  escolherCartao(normalize(texto), cartoes, { noCredito, parcelas });

describe("escolherCartao", () => {
  it("usa o cartao citado pelo nome", () => {
    expect(escolher("gastei 90 no mercado no nubank", [NUBANK, INTER])).toBe(NUBANK);
    expect(escolher("tv em 10x no Inter", [NUBANK, INTER], false, 10)).toBe(INTER);
  });

  it("nome como palavra inteira ('inter' nao casa com 'internet')", () => {
    expect(escolher("paguei 120 de internet", [NUBANK, INTER])).toBeNull();
  });

  it("credito ou parcelas sem nome: o unico cartao", () => {
    expect(escolher("gastei 50 no credito", [NUBANK], true)).toBe(NUBANK);
    expect(escolher("tv de 1200 em 10x", [NUBANK], false, 10)).toBe(NUBANK);
  });

  it("credito sem nome e varios cartoes: pergunta", () => {
    expect(escolher("gastei 50 no credito", [NUBANK, INTER], true)).toBe(PERGUNTAR_CARTAO);
  });

  it("sem pista de cartao: sem cartao", () => {
    expect(escolher("paguei 58,90 no mercado", [NUBANK, INTER])).toBeNull();
  });

  it("parcelado sem nenhum cartao cadastrado: carne (sem cartao)", () => {
    expect(escolher("tv de 1200 em 10x", [], false, 10)).toBeNull();
  });

  it("nome mais especifico ganha", () => {
    const ultra = { nome: "Nubank Ultravioleta" };
    expect(escolher("gastei 200 no nubank ultravioleta", [NUBANK, ultra])).toBe(ultra);
  });
});
