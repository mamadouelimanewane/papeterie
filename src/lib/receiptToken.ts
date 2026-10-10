import { createHmac } from "crypto"
import { safeEqual } from "@/lib/auth"

/**
 * Jeton signé donnant accès au reçu d'UNE commande (HMAC du numéro de commande).
 * Il est ajouté au lien de retour de paiement et renvoyé par « Mes commandes » après contrôle du téléphone :
 * connaître un numéro de commande ne suffit pas pour lire le nom, le téléphone et les articles du client.
 */
export function receiptToken(orderId: string): string {
  const secret = process.env.NEXTAUTH_SECRET
  if (!secret) return ""
  return createHmac("sha256", secret).update("receipt:" + orderId).digest("base64url").slice(0, 32)
}

export function isValidReceiptToken(orderId: string, token: string | null | undefined): boolean {
  const expected = receiptToken(orderId)
  return !!expected && safeEqual(token ?? "", expected)
}

