import { describe, expect, it } from "vitest";
import { casaTexto, casaValor, transacaoCasa, trechoDestacado, valorDaBusca } from "../correspondencia";

const transacao = {
  descricao: "Remédio na farmácia",
  categoria: "Saúde",
  valor: 64.7,
  data: new Date("2026-11-19T00:00:00Z"),
  tipo: "despesa" as const,
  origem: "whatsapp",
  autor: { nome: "Ana Souza" },
};

describe("casaTexto", () => {
  it("ignora acento e maiuscula", () => {
    expect(casaTexto(["Saúde"], "saude")).toBe(true);
    expect(casaTexto(["farmacia"], "FARMÁCIA")).toBe(true);
  });

  it("exige todas as palavras, em qualquer ordem", () => {
    expect(casaTexto(["Mercado", "Ana"], "ana mercado")).toBe(true);
    expect(casaTexto(["Mercado", "Ana"], "ana uber")).toBe(false);
  });
});

describe("valorDaBusca / casaValor", () => {
  it("le formatos brasileiros", () => {
    expect(valorDaBusca("58,90")).toEqual({ valor: 58.9, temCentavos: true });
    expect(valorDaBusca("R$ 1.234,56")).toEqual({ valor: 1234.56, temCentavos: true });
    expect(valorDaBusca("1.200")).toEqual({ valor: 1200, temCentavos: false });
    expect(valorDaBusca("50")).toEqual({ valor: 50, temCentavos: false });
    expect(valorDaBusca("mercado")).toBeNull();
  });

  it("valor inteiro casa com os centavos daquele real", () => {
    expect(casaValor(64.7, "64")).toBe(true);
    expect(casaValor(65, "64")).toBe(false);
    expect(casaValor(64.7, "64,70")).toBe(true);
    expect(casaValor(64.71, "64,70")).toBe(false);
  });
});

describe("transacaoCasa", () => {
  it("acha por descricao, categoria, pessoa, valor e data", () => {
    expect(transacaoCasa(transacao, "remedio")).toBe(true);
    expect(transacaoCasa(transacao, "saude ana")).toBe(true);
    expect(transacaoCasa(transacao, "64,70")).toBe(true);
    expect(transacaoCasa(transacao, "19/11")).toBe(true);
    expect(transacaoCasa(transacao, "whatsapp")).toBe(true);
    expect(transacaoCasa(transacao, "mercado")).toBe(false);
  });
});

describe("trechoDestacado", () => {
  it("destaca o trecho no texto original, com acento", () => {
    expect(trechoDestacado("Farmácia", "farmacia")).toEqual({ antes: "", meio: "Farmácia", depois: "" });
    expect(trechoDestacado("Remédio na farmácia", "farm")).toEqual({
      antes: "Remédio na ",
      meio: "farm",
      depois: "ácia",
    });
  });
});
