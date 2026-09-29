import { describe, expect, it } from "vitest";
import { extractIncomingIdentity, formatBrazilianPhoneForDisplay, identitiesOverlap } from "../phone";

// Mesmos valores reais documentados no antigo allowlist.test.ts: PN sem o
// digito "9" extra de celular brasileiro, LID num dominio totalmente
// diferente e sem nenhum digito em comum com o telefone.
const PN = "559981130945@s.whatsapp.net";
const PN_COM_DISPOSITIVO = "559981130945:12@s.whatsapp.net";
const LID = "32577326948544@lid";

describe("extractIncomingIdentity", () => {
  it("normaliza o PN e nao preenche jidAlt quando ausente", () => {
    expect(extractIncomingIdentity({ remoteJid: PN })).toEqual({ jid: PN, jidAlt: null });
  });

  it("remove o sufixo de dispositivo do PN", () => {
    expect(extractIncomingIdentity({ remoteJid: PN_COM_DISPOSITIVO })).toEqual({ jid: PN, jidAlt: null });
  });

  it("preenche jidAlt normalizado quando o servidor reporta a forma alternativa PN<->LID", () => {
    expect(extractIncomingIdentity({ remoteJid: PN, remoteJidAlt: LID })).toEqual({ jid: PN, jidAlt: LID });
  });

  it("retorna null quando remoteJid esta ausente", () => {
    expect(extractIncomingIdentity({})).toBeNull();
  });
});

describe("identitiesOverlap", () => {
  it("aceita quando o jid primario bate direto", () => {
    expect(identitiesOverlap({ jid: PN, jidAlt: null }, { jid: PN, jidAlt: null })).toBe(true);
  });

  it("aceita casamento via jidAlt -- caso real: vinculado por LID, mensagem chega enderecada por PN", () => {
    const recebida = { jid: PN, jidAlt: LID };
    const vinculado = { jid: LID, jidAlt: null };
    expect(identitiesOverlap(recebida, vinculado)).toBe(true);
  });

  it("rejeita quando nenhuma forma bate", () => {
    const recebida = { jid: PN, jidAlt: LID };
    const outraPessoa = { jid: "5511888888888@s.whatsapp.net", jidAlt: null };
    expect(identitiesOverlap(recebida, outraPessoa)).toBe(false);
  });
});

describe("formatBrazilianPhoneForDisplay", () => {
  it("reinsere o '9' que falta em celular brasileiro", () => {
    expect(formatBrazilianPhoneForDisplay(PN)).toBe("+55 99 98113-0945");
  });

  it("nao duplica o '9' quando o numero ja vem completo", () => {
    expect(formatBrazilianPhoneForDisplay("5511987654321@s.whatsapp.net")).toBe("+55 11 98765-4321");
  });

  it("retorna null pra LID -- nao tem numero derivavel", () => {
    expect(formatBrazilianPhoneForDisplay(LID)).toBeNull();
  });

  it("cai no formato bruto pra numero que nao comeca com 55", () => {
    expect(formatBrazilianPhoneForDisplay("15551234567@s.whatsapp.net")).toBe("+15551234567");
  });
});
