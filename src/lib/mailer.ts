import nodemailer from "nodemailer"
import { prisma } from "@/lib/prisma"
import { getSetting } from "@/lib/appSettings"

/**
 * Envoi des e-mails transactionnels.
 * - Réglages : Paramètres → « Envoi des e-mails » (clé « email » : host, port, username, password, encryption, fromEmail, fromName).
 * - Textes : Paramètres → « Modèles d'e-mail » (événement, sujet, contenu avec {name}, {order_id}, {total}, {store}, {link}) ;
 *   à défaut de modèle actif, un texte par défaut est utilisé.
 * Un e-mail qui échoue ne bloque jamais l'action en cours (commande, paiement…) : l'erreur est seulement journalisée.
 */
export type MailEvent =
  | "order_placed" | "order_delivered" | "store_new_order" | "user_register"
  | "password_reset" | "driver_approved" | "driver_rejected" | "order_refunded"

type EmailSettings = { host?: string; port?: number | string; username?: string; password?: string; encryption?: string; fromEmail?: string; fromName?: string }

const DEFAULTS: Record<MailEvent, { subject: string; body: string }> = {
  order_placed: { subject: "Commande {order_id} confirmée", body: "Bonjour {name},\n\nNous avons bien reçu le paiement de votre commande {order_id} ({total}). Nous vous prévenons dès qu'elle part en livraison.\n\nL'équipe {store}" },
  order_delivered: { subject: "Votre commande {order_id} a été livrée", body: "Bonjour {name},\n\nVotre commande {order_id} vient d'être livrée. Bonne rentrée !\n\nL'équipe {store}" },
  store_new_order: { subject: "Nouvelle commande payée : {order_id}", body: "Bonjour,\n\nUne nouvelle commande vient d'être payée : {order_id} ({total}), client {name}.\nPréparez-la depuis le back-office : {link}\n\n{store}" },
  user_register: { subject: "Bienvenue chez {store}, {name} !", body: "Bonjour {name},\n\nMerci pour votre inscription. Retrouvez tous vos livres et fournitures sur {link}.\n\nL'équipe {store}" },
  password_reset: { subject: "Réinitialiser votre mot de passe", body: "Bonjour {name},\n\nPour choisir un nouveau mot de passe, ouvrez ce lien (valable 1 heure) :\n{link}\n\nSi vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail." },
  driver_approved: { subject: "Votre compte livreur est validé", body: "Bonjour {name},\n\nVos documents ont été approuvés : vous pouvez maintenant recevoir des commandes.\n\nL'équipe {store}" },
  driver_rejected: { subject: "Documents refusés — action requise", body: "Bonjour {name},\n\nCertains de vos documents n'ont pas pu être validés. Merci de les renvoyer depuis l'application.\n\nL'équipe {store}" },
  order_refunded: { subject: "Remboursement de votre commande {order_id}", body: "Bonjour {name},\n\nLe remboursement de votre commande {order_id} ({total}) a été effectué.\n\nL'équipe {store}" },
}

/** Adresse e-mail utilisable : exclut les adresses techniques créées depuis un numéro (ex. 771234567@papeterie.sn). */
export function isRealEmail(email?: string | null): email is string {
  if (!email) return false
  const e = email.trim().toLowerCase()
  return /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/.test(e) && !/^\+?\d{6,15}@papeterie\.sn$/.test(e)
}

async function settings(): Promise<EmailSettings | null> {
  const s = (await getSetting("email")) as EmailSettings | null
  return s?.host && s?.fromEmail ? s : null
}

/** L'envoi est-il configuré (hôte SMTP + expéditeur) ? */
export async function mailConfigured() { return !!(await settings()) }

const fill = (t: string, vars: Record<string, string | number | undefined>) => t.replace(/\{(\w+)\}/g, (m, k) => (vars[k] !== undefined ? String(vars[k]) : m))

async function template(event: MailEvent) {
  const rec = await prisma.adminRecord.findFirst({ where: { collection: "email-templates", data: { path: ["event"], equals: event } }, orderBy: { updatedAt: "desc" } })
  const d = rec?.data as { subject?: string; body?: string; status?: string } | undefined
  if (d?.status === "Inactive") return null // modèle désactivé par l'administrateur : pas d'envoi
  return d?.subject && d?.body ? { subject: d.subject, body: d.body } : DEFAULTS[event]
}

/** Envoie un e-mail brut (utilisé par l'envoi de test). */
export async function sendMail(to: string, subject: string, text: string): Promise<{ ok: boolean; error?: string }> {
  const s = await settings()
  if (!s) return { ok: false, error: "Envoi des e-mails non configuré (Paramètres → Envoi des e-mails)" }
  const port = Number(s.port) || 587
  const enc = String(s.encryption ?? "").toUpperCase()
  try {
    const transport = nodemailer.createTransport({
      host: s.host, port, secure: enc === "SSL" || port === 465, requireTLS: enc === "TLS",
      auth: s.username ? { user: s.username, pass: s.password ?? "" } : undefined,
      connectionTimeout: 8000, greetingTimeout: 8000, socketTimeout: 10000,
    })
    await transport.sendMail({ from: s.fromName ? `"${s.fromName.replace(/"/g, "")}" <${s.fromEmail}>` : s.fromEmail, to, subject, text })
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erreur d'envoi" }
  }
}

/** Envoie l'e-mail d'un événement (modèle du back-office ou texte par défaut). Ne lève jamais d'erreur. */
export async function sendEventMail(event: MailEvent, to: string | null | undefined, vars: Record<string, string | number | undefined>) {
  try {
    if (!isRealEmail(to)) return { ok: false, error: "Pas d'adresse e-mail" }
    if (!(await settings())) return { ok: false, error: "Envoi non configuré" }
    const t = await template(event)
    if (!t) return { ok: false, error: "Modèle désactivé" }
    const all = { store: "Schoolmatik Librairie", link: process.env.NEXT_PUBLIC_APP_URL ?? "", ...vars }
    const r = await sendMail(to, fill(t.subject, all), fill(t.body, all))
    if (!r.ok) console.error(`[mailer] ${event} -> ${to} : ${r.error}`)
    return r
  } catch (e) {
    console.error("[mailer]", event, e)
    return { ok: false, error: "Erreur d'envoi" }
  }
}
