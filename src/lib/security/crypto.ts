import { createCipheriv, createDecipheriv, createHash, createHmac, hkdfSync, randomBytes } from "crypto"

/**
 * Chiffrement symétrique AES-256-GCM (secrets 2FA en base, fichiers de sauvegarde).
 * Clé dérivée (HKDF) de BACKUP_KEY si définie, sinon de NEXTAUTH_SECRET, avec un contexte par usage.
 */
function masterSecret(purpose: "totp" | "backup") {
  const s = (purpose === "backup" ? process.env.BACKUP_KEY : undefined) || process.env.NEXTAUTH_SECRET
  if (!s) throw new Error("Secret de chiffrement manquant (NEXTAUTH_SECRET)")
  return s
}

export function deriveKey(purpose: "totp" | "backup"): Buffer {
  return Buffer.from(hkdfSync("sha256", masterSecret(purpose), "schoolmatik", `schoolmatik:${purpose}`, 32))
}

/** Empreinte courte de la clé (rangée dans l'en-tête des sauvegardes pour savoir laquelle utiliser). */
export const keyFingerprint = (key: Buffer) => createHash("sha256").update(key).digest("hex").slice(0, 12)

export function encrypt(data: Buffer, key: Buffer): Buffer {
  const iv = randomBytes(12)
  const c = createCipheriv("aes-256-gcm", key, iv)
  const body = Buffer.concat([c.update(data), c.final()])
  return Buffer.concat([iv, c.getAuthTag(), body]) // iv (12) | tag (16) | données
}

export function decrypt(blob: Buffer, key: Buffer): Buffer {
  const d = createDecipheriv("aes-256-gcm", key, blob.subarray(0, 12))
  d.setAuthTag(blob.subarray(12, 28))
  return Buffer.concat([d.update(blob.subarray(28)), d.final()])
}

export const encryptText = (s: string) => encrypt(Buffer.from(s, "utf8"), deriveKey("totp")).toString("base64")
export const decryptText = (s: string) => decrypt(Buffer.from(s, "base64"), deriveKey("totp")).toString("utf8")

// ---------------------------------------------------------------------------
// TOTP (RFC 6238) : codes à 6 chiffres toutes les 30 s (Google Authenticator, Authy, Microsoft Authenticator…)
// ---------------------------------------------------------------------------

const B32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"

export function base32Encode(buf: Buffer) {
  let bits = 0, value = 0, out = ""
  for (const byte of buf) {
    value = (value << 8) | byte; bits += 8
    while (bits >= 5) { out += B32[(value >>> (bits - 5)) & 31]; bits -= 5 }
  }
  if (bits > 0) out += B32[(value << (5 - bits)) & 31]
  return out
}

function base32Decode(s: string) {
  let bits = 0, value = 0
  const out: number[] = []
  for (const ch of s.replace(/=+$/, "").toUpperCase()) {
    const i = B32.indexOf(ch)
    if (i < 0) continue
    value = (value << 5) | i; bits += 5
    if (bits >= 8) { out.push((value >>> (bits - 8)) & 255); bits -= 8 }
  }
  return Buffer.from(out)
}

export const newTotpSecret = () => base32Encode(randomBytes(20))

function hotp(secret: string, counter: number) {
  const msg = Buffer.alloc(8)
  msg.writeBigUInt64BE(BigInt(counter))
  const h = createHmac("sha1", base32Decode(secret)).update(msg).digest()
  const o = h[h.length - 1] & 15
  const n = ((h[o] & 0x7f) << 24) | (h[o + 1] << 16) | (h[o + 2] << 8) | h[o + 3]
  return String(n % 1_000_000).padStart(6, "0")
}

/** Code valide pour l'instant présent (± 30 s de décalage d'horloge toléré). */
export function verifyTotp(secret: string, code: unknown, now = Date.now()) {
  const c = String(code ?? "").replace(/\s/g, "")
  if (!/^\d{6}$/.test(c)) return false
  const step = Math.floor(now / 30_000)
  return [-1, 0, 1].some((d) => hotp(secret, step + d) === c)
}

export const totpNow = (secret: string, now = Date.now()) => hotp(secret, Math.floor(now / 30_000))

export const otpauthUrl = (secret: string, email: string) =>
  `otpauth://totp/${encodeURIComponent(`Schoolmatik Admin:${email}`)}?secret=${secret}&issuer=${encodeURIComponent("Schoolmatik Admin")}&algorithm=SHA1&digits=6&period=30`
