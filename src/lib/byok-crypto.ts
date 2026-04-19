// TODO(2026-05-19): Drop legacy XOR decrypt path. Run the following query first
// to confirm zero legacy keys remain:
//   SELECT count(*) FROM user_settings
//   WHERE anthropic_api_key_encrypted IS NOT NULL
//     AND substring(decode(anthropic_api_key_encrypted, 'base64') from 1 for 1) != E'\\x01';
// If count is 0, remove getLegacyXorKey, isLegacyCiphertext, and the legacy
// branch in decrypt(). Also remove SUPABASE_SERVICE_ROLE_KEY usage from this file.

import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

const VERSION_AES_GCM = 0x01;

const AES_KEY_BYTES = 32;
const AES_IV_BYTES = 12;
const AES_TAG_BYTES = 16;

function getAesKey(): Buffer {
  const b64 = process.env.BYOK_ENCRYPTION_KEY;
  if (!b64) {
    throw new Error('[byok] BYOK_ENCRYPTION_KEY missing. Set in Vercel + .env.local.');
  }
  const key = Buffer.from(b64, 'base64');
  if (key.length !== AES_KEY_BYTES) {
    throw new Error(`[byok] BYOK_ENCRYPTION_KEY must decode to ${AES_KEY_BYTES} bytes, got ${key.length}`);
  }
  return key;
}

function getLegacyXorKey(): string {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error('[byok] SUPABASE_SERVICE_ROLE_KEY missing — needed for legacy decrypt path.');
  }
  return key;
}

/**
 * Ciphertext format (base64-encoded bytes):
 *   [version:1][iv:12][tag:16][ciphertext:N]
 * Legacy XOR rows predating this module are raw XOR output with no version
 * prefix. Detect by absence of the version byte structure.
 */
export function encrypt(plaintext: string): string {
  const key = getAesKey();
  const iv = randomBytes(AES_IV_BYTES);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const ct = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  const out = Buffer.concat([Buffer.from([VERSION_AES_GCM]), iv, tag, ct]);
  return out.toString('base64');
}

export function decrypt(ciphertextB64: string): string {
  const buf = Buffer.from(ciphertextB64, 'base64');

  const looksLikeAes =
    buf.length > 1 + AES_IV_BYTES + AES_TAG_BYTES &&
    buf[0] === VERSION_AES_GCM;

  if (looksLikeAes) {
    const key = getAesKey();
    const iv = buf.subarray(1, 1 + AES_IV_BYTES);
    const tag = buf.subarray(1 + AES_IV_BYTES, 1 + AES_IV_BYTES + AES_TAG_BYTES);
    const ct = buf.subarray(1 + AES_IV_BYTES + AES_TAG_BYTES);
    const decipher = createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);
    const pt = Buffer.concat([decipher.update(ct), decipher.final()]);
    return pt.toString('utf8');
  }

  const xorKey = getLegacyXorKey();
  const out = Buffer.alloc(buf.length);
  for (let i = 0; i < buf.length; i++) {
    out[i] = buf[i] ^ xorKey.charCodeAt(i % xorKey.length);
  }
  return out.toString('utf8');
}

export function isLegacyCiphertext(ciphertextB64: string): boolean {
  const buf = Buffer.from(ciphertextB64, 'base64');
  return !(buf.length > 1 + AES_IV_BYTES + AES_TAG_BYTES && buf[0] === VERSION_AES_GCM);
}
