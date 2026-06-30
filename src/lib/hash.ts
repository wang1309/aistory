import { SnowflakeIdv1 } from "simple-flakeid";
import { v4 as uuidv4 } from "uuid";
import { randomBytes } from "crypto";

const BASE62_CHARS =
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

/**
 * Generate a short, URL-friendly share id (11 chars, base62).
 * Collisions are backed by the unique index on share_id.
 */
export function getShareId(): string {
  const bytes = randomBytes(11);
  let out = "";
  for (let i = 0; i < bytes.length; i++) {
    out += BASE62_CHARS[bytes[i] % 62];
  }
  return out;
}

/**
 * Generate a delete token for anonymous-owned shares, so the creator can
 * remove a share without an account.
 */
export function getShareDeleteToken(): string {
  return randomBytes(16).toString("base64url");
}

export function getUuid(): string {
  return uuidv4();
}

export function getUniSeq(prefix: string = ""): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 8);

  return `${prefix}${randomPart}${timestamp}`;
}

export function getNonceStr(length: number): string {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  const charactersLength = characters.length;

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charactersLength);
    result += characters[randomIndex];
  }

  return result;
}

export function getSnowId(): string {
  const gen = new SnowflakeIdv1({ workerId: 1 });
  const snowId = gen.NextId();

  return snowId.toString();
}
