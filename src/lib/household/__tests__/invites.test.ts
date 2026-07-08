import { describe, expect, it } from "vitest";
import { isInviteRedeemable } from "../invites";

describe("isInviteRedeemable", () => {
  const AGORA = new Date("2026-07-06T12:00:00Z");

  it("aceita convite valido, nao expirado e nao usado", () => {
    const invite = { expiraEm: new Date("2026-07-10T12:00:00Z"), usadoEm: null };
    expect(isInviteRedeemable(invite, AGORA)).toBe(true);
  });

  it("rejeita convite expirado", () => {
    const invite = { expiraEm: new Date("2026-07-01T12:00:00Z"), usadoEm: null };
    expect(isInviteRedeemable(invite, AGORA)).toBe(false);
  });

  it("rejeita convite ja utilizado", () => {
    const invite = { expiraEm: new Date("2026-07-10T12:00:00Z"), usadoEm: new Date("2026-07-05T12:00:00Z") };
    expect(isInviteRedeemable(invite, AGORA)).toBe(false);
  });
});
