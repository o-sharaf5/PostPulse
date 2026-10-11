import crypto from "node:crypto";

/**
 * AES-256-GCM at rest for OAuth access/refresh tokens.
 * TOKEN_KEY: 32 random bytes, hex encoded. Generate:
 *   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
 * Format stored in DB: iv.ciphertext.authTag (all base64).
 */

function getKey(): Buffer {
  const key = process.env.TOKEN_KEY;
  if (!key || key.length !== 64) {
    throw new Error("TOKEN_KEY must be a 64-char hex string (32 bytes). See .env.example.");
  }
  return Buffer.from(key, "hex");
}

export function encrypt(plaintext: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", getKey(), iv);
  const enc = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  return [iv.toString("base64"), enc.toString("base64"), cipher.getAuthTag().toString("base64")].join(".");
}

export function decrypt(payload: string): string {
  const [iv, data, tag] = payload.split(".");
  if (!iv || !data || !tag) throw new Error("Malformed encrypted payload");
  const decipher = crypto.createDecipheriv("aes-256-gcm", getKey(), Buffer.from(iv, "base64"));
  decipher.setAuthTag(Buffer.from(tag, "base64"));
  return Buffer.concat([decipher.update(Buffer.from(data, "base64")), decipher.final()]).toString("utf8");
}

export function randomState(): string {
  return crypto.randomBytes(24).toString("base64url");
}
