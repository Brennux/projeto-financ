import { describe, expect, it } from "vitest";
import { isLinkCodeClaimable } from "../linkCode";

describe("isLinkCodeClaimable", () => {
  const AGORA = new Date("2026-09-28T12:00:00Z");

  it("aceita codigo valido, nao expirado e nao usado", () => {
    const linkCode = { expiraEm: new Date("2026-09-28T12:10:00Z"), usadoEm: null };
    expect(isLinkCodeClaimable(linkCode, AGORA)).toBe(true);
  });

  it("rejeita codigo expirado", () => {
    const linkCode = { expiraEm: new Date("2026-09-28T11:00:00Z"), usadoEm: null };
    expect(isLinkCodeClaimable(linkCode, AGORA)).toBe(false);
  });

  it("rejeita codigo ja utilizado", () => {
    const linkCode = { expiraEm: new Date("2026-09-28T12:10:00Z"), usadoEm: new Date("2026-09-28T11:55:00Z") };
    expect(isLinkCodeClaimable(linkCode, AGORA)).toBe(false);
  });
});
