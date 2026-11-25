import { describe, expect, it } from "vitest";
import { parseMessage } from "../index";

const REF = new Date("2026-11-22T12:00:00");

describe("parseMessage com parcelamento", () => {
  it("'em 10x': valor dito e o total", () => {
    const r = parseMessage("Comprei uma tv de 1200 em 10x", REF);
    expect(r?.valor).toBe(1200);
    expect(r?.parcelas).toBe(10);
    expect(r?.descricao).not.toMatch(/10x/);
  });

  it("'10x de 120': valor dito e o da parcela", () => {
    const r = parseMessage("Comprei geladeira 10x de 120", REF);
    expect(r?.valor).toBe(1200);
    expect(r?.parcelas).toBe(10);
  });

  it("'10x de R$ 99,90' com prefixo e centavos", () => {
    const r = parseMessage("Paguei o celular em 12x de R$ 99,90", REF);
    expect(r?.valor).toBe(1198.8);
    expect(r?.parcelas).toBe(12);
  });

  it("'parcelado em 3 vezes'", () => {
    const r = parseMessage("Gastei 300 no dentista parcelado em 3 vezes", REF);
    expect(r?.valor).toBe(300);
    expect(r?.parcelas).toBe(3);
    expect(r?.categoria).toBe("Saúde");
  });

  it("sem parcelamento continua a vista", () => {
    const r = parseMessage("Paguei 58,90 no mercado", REF);
    expect(r?.parcelas).toBe(1);
    expect(r?.noCredito).toBe(false);
  });

  it("1x nao e parcelamento", () => {
    expect(parseMessage("Gastei 80 em 1x no bar", REF)?.parcelas).toBe(1);
  });

  it("palavra com x no meio nao vira parcela ('3 xicaras')", () => {
    const r = parseMessage("Comprei 3 xicaras por 45", REF);
    expect(r?.parcelas).toBe(1);
  });

  it("percebe quando fala em credito/cartao", () => {
    expect(parseMessage("Gastei 50 no mercado no crédito", REF)?.noCredito).toBe(true);
    expect(parseMessage("Paguei 90 no cartão", REF)?.noCredito).toBe(true);
  });

  it("receita nunca e parcelada", () => {
    expect(parseMessage("Recebi 1000 em 2x", REF)?.parcelas).toBe(1);
  });

  it("so o numero de parcelas, sem valor, falha", () => {
    expect(parseMessage("Comprei uma tv em 10x", REF)).toBeNull();
  });
});
