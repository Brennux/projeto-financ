import "server-only";
import bcrypt from "bcryptjs";

const SALT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Hash valido (mesmo custo) de uma senha que nunca sera usada de verdade --
 * comparar contra ele quando o email nao existe faz o login levar o mesmo
 * tempo de um email existente com senha errada, sem vazar via timing se a
 * conta existe.
 */
export const DUMMY_HASH = bcrypt.hashSync("senha-nao-usada-apenas-para-timing", SALT_ROUNDS);
