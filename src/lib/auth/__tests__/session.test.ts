import { describe, expect, it } from "vitest";
import { SignJWT } from "jose";
import { encrypt, decrypt } from "../session";

describe("encrypt/decrypt", () => {
  it("faz o round-trip do payload da sessao", async () => {
    const payload = { userId: "user_1", householdId: "house_1", expiresAt: Date.now() + 1000 };
    const token = await encrypt(payload);
    const decoded = await decrypt(token);

    expect(decoded?.userId).toBe(payload.userId);
    expect(decoded?.householdId).toBe(payload.householdId);
  });

  it("retorna undefined pra token adulterado", async () => {
    const token = await encrypt({ userId: "user_1", householdId: "house_1", expiresAt: Date.now() + 1000 });

    expect(await decrypt(`${token}adulterado`)).toBeUndefined();
  });

  it("retorna undefined pra token expirado", async () => {
    // Assina um token com "exp" no passado direto pelo jose, ja que
    // encrypt() sempre usa 30d fixos e nao da pra simular expiracao por ele.
    const encodedKey = new TextEncoder().encode(process.env.SESSION_SECRET);
    const tokenExpirado = await new SignJWT({ userId: "user_1", householdId: "house_1" })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt(Math.floor(Date.now() / 1000) - 60)
      .setExpirationTime(Math.floor(Date.now() / 1000) - 30)
      .sign(encodedKey);

    expect(await decrypt(tokenExpirado)).toBeUndefined();
  });

  it("retorna undefined pra sessao ausente", async () => {
    expect(await decrypt(undefined)).toBeUndefined();
  });
});
