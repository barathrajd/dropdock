import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // 96 bits for GCM

export function encryptSecret(plainText: string, masterKeyHex: string): string {
  const key = Buffer.from(masterKeyHex, "hex");
  if (key.length !== 32) {
    throw new Error("Master encryption key must be 32 bytes (64 hex characters)");
  }

  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([cipher.update(plainText, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return `${iv.toString("hex")}:${tag.toString("hex")}:${encrypted.toString("hex")}`;
}

export function decryptSecret(encryptedPayload: string, masterKeyHex: string): string {
  const [ivHex, tagHex, cipherHex] = encryptedPayload.split(":");
  if (!ivHex || !tagHex || !cipherHex) {
    throw new Error("Invalid encrypted payload format (expected iv:tag:ciphertext)");
  }

  const key = Buffer.from(masterKeyHex, "hex");
  const iv = Buffer.from(ivHex, "hex");
  const tag = Buffer.from(tagHex, "hex");
  const ciphertext = Buffer.from(cipherHex, "hex");

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return decrypted.toString("utf8");
}
