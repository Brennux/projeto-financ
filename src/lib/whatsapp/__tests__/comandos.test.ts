import { describe, expect, it } from "vitest";
import { detectarComando } from "../comandos";

describe("detectarComando", () => {
  it("reconhece ajuda e saudacoes", () => {
    expect(detectarComando("ajuda")).toEqual({ tipo: "ajuda" });
    expect(detectarComando("Oi!")).toEqual({ tipo: "ajuda" });
    expect(detectarComando("Olá")).toEqual({ tipo: "ajuda" });
  });

  it("reconhece desfazer e variacoes", () => {
    expect(detectarComando("desfazer")).toEqual({ tipo: "desfazer" });
    expect(detectarComando("Apagar")).toEqual({ tipo: "desfazer" });
    expect(detectarComando("apaga o último")).toEqual({ tipo: "desfazer" });
  });

  it("reconhece saldo e resumo, com mes passado", () => {
    expect(detectarComando("saldo")).toEqual({ tipo: "saldo", mesPassado: false });
    expect(detectarComando("Saldo do mês passado?")).toEqual({ tipo: "saldo", mesPassado: true });
    expect(detectarComando("resumo")).toEqual({ tipo: "resumo", mesPassado: false });
  });

  it("entende quanto gastei com uma categoria", () => {
    expect(detectarComando("Quanto gastei com mercado?")).toEqual({
      tipo: "quanto",
      termo: "mercado",
      mesPassado: false,
    });
    expect(detectarComando("quanto gastamos em restaurante esse mês")).toEqual({
      tipo: "quanto",
      termo: "restaurante",
      mesPassado: false,
    });
    expect(detectarComando("qto gastei de uber mes passado")).toEqual({
      tipo: "quanto",
      termo: "uber",
      mesPassado: true,
    });
  });

  it("entende quanto gastei sem categoria (total)", () => {
    expect(detectarComando("quanto gastei?")).toEqual({ tipo: "quanto", termo: null, mesPassado: false });
    expect(detectarComando("quanto gastamos este mês")).toEqual({ tipo: "quanto", termo: null, mesPassado: false });
  });

  it("entende 'gastos com X'", () => {
    expect(detectarComando("gastos com lazer")).toEqual({ tipo: "quanto", termo: "lazer", mesPassado: false });
  });

  it("entende fatura (de todos ou de um cartao)", () => {
    expect(detectarComando("fatura")).toEqual({ tipo: "fatura", termo: null });
    expect(detectarComando("Faturas?")).toEqual({ tipo: "fatura", termo: null });
    expect(detectarComando("fatura do nubank")).toEqual({ tipo: "fatura", termo: "nubank" });
    expect(detectarComando("minha fatura")).toEqual({ tipo: "fatura", termo: null });
    expect(detectarComando("gastei 50 no cartao")).toBeNull();
  });

  it("nao confunde lancamento com comando", () => {
    expect(detectarComando("gasto com mercado 50")).toBeNull();
    expect(detectarComando("Paguei 58,90 no mercado")).toBeNull();
    expect(detectarComando("apagar a luz custou 30")).toBeNull();
    expect(detectarComando("")).toBeNull();
  });
});
