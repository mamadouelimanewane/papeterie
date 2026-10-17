/** Règles de mot de passe des comptes d'administration. */
export const MIN_ADMIN_PASSWORD = 10

const COMMON = ["password", "motdepasse", "azerty", "qwerty", "123456", "admin", "schoolmatik", "senegal", "dakar", "bienvenue", "welcome", "papeterie", "librairie"]

/** Message d'erreur, ou null si le mot de passe est acceptable. */
export function passwordProblem(password: unknown, email?: string | null): string | null {
  const p = String(password ?? "")
  if (p.length < MIN_ADMIN_PASSWORD) return `Mot de passe trop court (${MIN_ADMIN_PASSWORD} caractères minimum)`
  if (p.length > 200) return "Mot de passe trop long"
  if (!/[a-zA-Z]/.test(p) || !/\d/.test(p)) return "Le mot de passe doit contenir des lettres et au moins un chiffre"
  const low = p.toLowerCase()
  const local = (email ?? "").split("@")[0]?.toLowerCase()
  if (local && local.length >= 4 && low.includes(local)) return "Le mot de passe ne doit pas contenir l'adresse e-mail"
  if (COMMON.some((w) => low.replace(/[^a-z]/g, "") === w || low.startsWith(w + "1") || low === w + "123")) return "Mot de passe trop courant : choisissez-en un moins prévisible"
  if (/^(.)\1+$/.test(p)) return "Mot de passe trop simple"
  return null
}
