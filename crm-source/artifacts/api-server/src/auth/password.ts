import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const HASH_PREFIX = "scrypt";
const SALT_BYTES = 16;
const KEY_BYTES = 64;

function isHex(value: string): boolean {
  return /^[0-9a-f]+$/i.test(value);
}

export function hashPassword(password: string): string {
  const salt = randomBytes(SALT_BYTES);
  const hash = scryptSync(password, salt, KEY_BYTES);

  return `${HASH_PREFIX}$${salt.toString("hex")}$${hash.toString("hex")}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [prefix, saltHex, hashHex] = stored.split("$");

  // Accept legacy plain-text demo credentials when no hash format exists.
  if (
    prefix !== HASH_PREFIX ||
    !saltHex ||
    !hashHex ||
    !isHex(saltHex) ||
    !isHex(hashHex)
  ) {
    return password === stored;
  }

  const salt = Buffer.from(saltHex, "hex");
  const expectedHash = Buffer.from(hashHex, "hex");
  const computedHash = scryptSync(password, salt, expectedHash.length);

  return timingSafeEqual(expectedHash, computedHash);
}
