import { describe, expect, it } from "vitest";
import { budgetInputSchema } from "../budget";

describe("budgetInputSchema", () => {
  it("aceita uma categoria despesa-elegível com limite válido", () => {
    const result = budgetInputSchema.safeParse({ categoria: "Mercado", limite: 800 });
    expect(result.success).toBe(true);
  });

  it("rejeita limite negativo", () => {
    const result = budgetInputSchema.safeParse({ categoria: "Mercado", limite: -10 });
    expect(result.success).toBe(false);
  });

  it("rejeita limite zero", () => {
    const result = budgetInputSchema.safeParse({ categoria: "Mercado", limite: 0 });
    expect(result.success).toBe(false);
  });

  it("rejeita categoria vazia", () => {
    const result = budgetInputSchema.safeParse({ categoria: "  ", limite: 100 });
    expect(result.success).toBe(false);
  });
});
