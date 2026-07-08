import { describe, expect, it } from "vitest";
import { parseMessage } from "@/lib/parser";
import { parsedTransactionSchema } from "../transaction";

describe("parsedTransactionSchema", () => {
  it("aceita a saida valida do parser", () => {
    const parsed = parseMessage("Paguei 58,90 no mercado", new Date("2026-07-06"));
    const result = parsedTransactionSchema.safeParse(parsed);
    expect(result.success).toBe(true);
  });

  it("rejeita valor negativo", () => {
    const result = parsedTransactionSchema.safeParse({
      tipo: "despesa",
      valor: -10,
      categoria: "Mercado",
      descricao: null,
      data: new Date(),
    });
    expect(result.success).toBe(false);
  });

  it("rejeita categoria fora do conjunto conhecido", () => {
    const result = parsedTransactionSchema.safeParse({
      tipo: "despesa",
      valor: 10,
      categoria: "NaoExiste",
      descricao: null,
      data: new Date(),
    });
    expect(result.success).toBe(false);
  });

  it("rejeita tipo invalido", () => {
    const result = parsedTransactionSchema.safeParse({
      tipo: "transferencia",
      valor: 10,
      categoria: "Outros",
      descricao: null,
      data: new Date(),
    });
    expect(result.success).toBe(false);
  });
});
