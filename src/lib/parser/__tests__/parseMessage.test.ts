import { describe, expect, it } from "vitest";
import { parseMessage } from "../index";

const REF_DATE = new Date("2026-07-06T12:00:00");

describe("parseMessage", () => {
  it("interpreta o exemplo canonico do produto", () => {
    const result = parseMessage("Paguei 58,90 no mercado", REF_DATE);
    expect(result).not.toBeNull();
    expect(result?.tipo).toBe("despesa");
    expect(result?.valor).toBe(58.9);
    expect(result?.categoria).toBe("Mercado");
    expect(result?.data.toISOString().slice(0, 10)).toBe("2026-07-06");
  });

  it("aceita valor com virgula decimal (padrao BR)", () => {
    const result = parseMessage("Gastei 20,50 com uber", REF_DATE);
    expect(result?.valor).toBe(20.5);
    expect(result?.categoria).toBe("Transporte");
  });

  it("aceita valor com ponto decimal", () => {
    const result = parseMessage("Paguei 58.90 no mercado", REF_DATE);
    expect(result?.valor).toBe(58.9);
  });

  it("aceita valor com prefixo R$", () => {
    const result = parseMessage("Paguei R$ 150 de aluguel", REF_DATE);
    expect(result?.valor).toBe(150);
    expect(result?.categoria).toBe("Moradia");
  });

  it("trata ponto com 3+ digitos como separador de milhar", () => {
    const result = parseMessage("Recebi 1.500 de salario", REF_DATE);
    expect(result?.valor).toBe(1500);
  });

  it("reconhece receita e categoria Salario", () => {
    const result = parseMessage("Recebi 1500 de salario", REF_DATE);
    expect(result?.tipo).toBe("receita");
    expect(result?.categoria).toBe("Salário");
  });

  it("entende 'ontem'", () => {
    const result = parseMessage("Paguei 30 no mercado ontem", REF_DATE);
    expect(result?.data.toISOString().slice(0, 10)).toBe("2026-07-05");
  });

  it("entende 'anteontem' (nao confunde com 'ontem')", () => {
    const result = parseMessage("Paguei 30 no mercado anteontem", REF_DATE);
    expect(result?.data.toISOString().slice(0, 10)).toBe("2026-07-04");
  });

  it("cai em categoria Outros quando nenhuma palavra-chave bate", () => {
    const result = parseMessage("Paguei 40 por algo aleatorio", REF_DATE);
    expect(result?.categoria).toBe("Outros");
  });

  it("preenche a descricao com o texto restante", () => {
    const result = parseMessage("Paguei 58,90 no mercado", REF_DATE);
    expect(result?.descricao).toBe("no mercado");
  });

  it("retorna null quando nao reconhece nem despesa nem receita", () => {
    const result = parseMessage("Oi tudo bem?", REF_DATE);
    expect(result).toBeNull();
  });

  it("retorna null quando nao ha valor numerico", () => {
    const result = parseMessage("Paguei no mercado", REF_DATE);
    expect(result).toBeNull();
  });

  it("retorna null para mensagem vazia", () => {
    expect(parseMessage("", REF_DATE)).toBeNull();
  });

  it("ignora acentos (teclado sem acento)", () => {
    const result = parseMessage("Paguei 25 na farmacia", REF_DATE);
    expect(result?.categoria).toBe("Saúde");
  });
});
