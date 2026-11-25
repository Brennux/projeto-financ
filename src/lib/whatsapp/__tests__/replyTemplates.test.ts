import { describe, expect, it } from "vitest";
import { buildAlertaOrcamento, buildConfirmationMessage, buildQuantoMessage } from "../replyTemplates";
import { encontrarCategoria } from "../comandos";
import { REGRAS_PADRAO } from "@/lib/parser/dictionaries";

describe("buildAlertaOrcamento", () => {
  it("nao avisa abaixo de 80%", () => {
    expect(buildAlertaOrcamento("Mercado", 700, 1000)).toBeNull();
  });

  it("avisa a partir de 80%", () => {
    expect(buildAlertaOrcamento("Mercado", 850, 1000)).toContain("85% do orçamento usado");
  });

  it("avisa quando estoura", () => {
    expect(buildAlertaOrcamento("Mercado", 1100, 1000)).toContain("orçamento estourado, 110%");
  });

  it("ignora limite zero", () => {
    expect(buildAlertaOrcamento("Mercado", 10, 0)).toBeNull();
  });
});

describe("buildConfirmationMessage", () => {
  const transacao = {
    tipo: "despesa" as const,
    valor: 50,
    categoria: "Mercado",
    descricao: null,
    data: new Date("2026-11-22T00:00:00Z"),
  };

  it("inclui o aviso de orcamento e a dica de desfazer", () => {
    const msg = buildConfirmationMessage(transacao, "⚠️ Mercado: 85%");
    expect(msg).toContain("⚠️ Mercado: 85%");
    expect(msg).toContain("*desfazer*");
  });
});

describe("buildQuantoMessage", () => {
  it("fala quando nao ha gastos", () => {
    expect(buildQuantoMessage("novembro", "Mercado", 0, 0)).toBe("🧾 Nenhum gasto com Mercado em novembro.");
  });

  it("mostra total, quantidade e orcamento", () => {
    const msg = buildQuantoMessage("novembro", "Mercado", 500, 3, { limite: 1000 });
    expect(msg).toContain("3 lançamentos");
    expect(msg).toContain("50% usado");
  });
});

describe("encontrarCategoria", () => {
  it("acha pelo nome, sem acento", () => {
    expect(encontrarCategoria("saude", REGRAS_PADRAO)).toBe("Saúde");
  });

  it("acha por palavra-chave", () => {
    expect(encontrarCategoria("uber", REGRAS_PADRAO)).toBe("Transporte");
  });

  it("devolve null quando nao existe", () => {
    expect(encontrarCategoria("foguete", REGRAS_PADRAO)).toBeNull();
  });
});
