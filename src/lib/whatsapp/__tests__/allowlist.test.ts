import { describe, expect, it } from "vitest";
import type { Contact } from "baileys";
import { isOwnerSelfChat } from "../allowlist";

// Espelha o formato real que o WhatsApp reporta pra propria conta: PN sem o
// digito "9" extra de celular brasileiro, LID num dominio totalmente
// diferente e sem nenhum digito em comum com o telefone.
const ME: Contact = {
  id: "32577326948544@lid",
  lid: "32577326948544@lid",
  phoneNumber: "559981130945@s.whatsapp.net",
};

describe("isOwnerSelfChat", () => {
  it("aceita mensagem endereçada pelo PN (formato tradicional)", () => {
    expect(isOwnerSelfChat("559981130945@s.whatsapp.net", ME)).toBe(true);
  });

  it("aceita mensagem endereçada pelo PN com sufixo de dispositivo", () => {
    expect(isOwnerSelfChat("559981130945:12@s.whatsapp.net", ME)).toBe(true);
  });

  it("aceita mensagem endereçada pelo LID -- caso real que quebrou antes desta correção", () => {
    expect(isOwnerSelfChat("32577326948544@lid", ME)).toBe(true);
  });

  it("rejeita conversa com outro numero", () => {
    expect(isOwnerSelfChat("5511888888888@s.whatsapp.net", ME)).toBe(false);
  });

  it("rejeita grupos", () => {
    expect(isOwnerSelfChat("123456-789@g.us", ME)).toBe(false);
  });

  it("rejeita remoteJid ausente", () => {
    expect(isOwnerSelfChat(undefined, ME)).toBe(false);
    expect(isOwnerSelfChat(null, ME)).toBe(false);
  });

  it("rejeita quando a identidade do proprio socket ainda nao esta disponivel", () => {
    expect(isOwnerSelfChat("559981130945@s.whatsapp.net", undefined)).toBe(false);
  });
});
