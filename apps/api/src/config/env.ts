import { randomBytes } from "crypto";
import { existsSync, readFileSync, writeFileSync } from "fs";

function getOrGenerateMasterKey(): string {
  if (process.env.MASTER_ENCRYPTION_KEY) {
    return process.env.MASTER_ENCRYPTION_KEY;
  }

  const keyFilePath = "data/.master.key";
  if (existsSync(keyFilePath)) {
    return readFileSync(keyFilePath, "utf8").trim();
  }

  const newKey = randomBytes(32).toString("hex");
  try {
    writeFileSync(keyFilePath, newKey, { encoding: "utf8", mode: 0o600 });
  } catch {
    // If running in readonly, use in-memory key
  }
  return newKey;
}

export const config = {
  port: parseInt(process.env.PORT || "3001", 10),
  masterKey: getOrGenerateMasterKey(),
};
