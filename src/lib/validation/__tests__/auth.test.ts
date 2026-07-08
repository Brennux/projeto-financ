import { describe, expect, it } from "vitest";
import { signupSchema, loginSchema } from "../auth";

describe("signupSchema", () => {
  it("aceita dados validos", () => {
    const result = signupSchema.safeParse({
      nome: "Ana",
      email: "ana@example.com",
      password: "senha123",
    });
    expect(result.success).toBe(true);
  });

  it("normaliza o email pra minusculas", () => {
    const result = signupSchema.safeParse({
      nome: "Ana",
      email: "Ana@Example.COM",
      password: "senha123",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("ana@example.com");
    }
  });

  it("rejeita senha curta demais", () => {
    const result = signupSchema.safeParse({ nome: "Ana", email: "ana@example.com", password: "abc123" });
    expect(result.success).toBe(false);
  });

  it("rejeita senha sem numero", () => {
    const result = signupSchema.safeParse({ nome: "Ana", email: "ana@example.com", password: "somenteletras" });
    expect(result.success).toBe(false);
  });

  it("rejeita email invalido", () => {
    const result = signupSchema.safeParse({ nome: "Ana", email: "nao-e-email", password: "senha123" });
    expect(result.success).toBe(false);
  });
});

describe("loginSchema", () => {
  it("normaliza o email pra minusculas", () => {
    const result = loginSchema.safeParse({ email: "Ana@Example.COM", password: "qualquer" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("ana@example.com");
    }
  });

  it("rejeita senha vazia", () => {
    const result = loginSchema.safeParse({ email: "ana@example.com", password: "" });
    expect(result.success).toBe(false);
  });
});
