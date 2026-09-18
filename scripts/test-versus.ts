/**
 * Test d'integration de l'API de paiement Versus Fintech.
 *
 * Verifie, dans l'ordre :
 *   1. la presence des variables d'environnement VERSUS_*
 *   2. l'authentification (obtention d'un token)
 *   3. la recuperation des services de paiement disponibles (Wave, Orange Money...)
 *   4. l'initialisation d'un paiement de test (montant fictif, environnement staging)
 *
 * Lancement :  npm run test:versus
 * (charge automatiquement .env — ne debite aucun fonds : environnement staging)
 */
import { getVersusToken, getVersusServices, createVersusPayment } from "../src/lib/versus"

function ok(msg: string) { console.log("\x1b[32m✅ " + msg + "\x1b[0m") }
function ko(msg: string) { console.log("\x1b[31m❌ " + msg + "\x1b[0m") }
function step(msg: string) { console.log("\n\x1b[36m" + msg + "\x1b[0m") }

async function main() {
  // 1. Variables d'environnement
  step("1. Verification des variables d'environnement")
  const missing = ["VERSUS_LOGIN", "VERSUS_PASSWORD"].filter((k) => !process.env[k])
  if (missing.length) {
    ko(`Variables manquantes : ${missing.join(", ")}`)
    console.log("   -> Renseignez-les dans .env (local) et dans Vercel (production).")
    process.exit(1)
  }
  ok(`Base URL : ${process.env.VERSUS_BASE_URL ?? "(defaut staging)"}`)

  // 2. Authentification
  step("2. Authentification")
  const token = await getVersusToken()
  if (!token) {
    ko("Echec de l'authentification (identifiants invalides ou API injoignable)")
    process.exit(1)
  }
  ok(`Token obtenu (${token.length} caracteres)`)

  // 3. Services disponibles
  step("3. Services de paiement disponibles")
  try {
    const services = await getVersusServices()
    const list = services?.data ?? []
    if (Array.isArray(list) && list.length) {
      for (const s of list) console.log(`   • ${s.name} (${s.code})`)
      ok(`${list.length} service(s) disponible(s)`)
    } else {
      console.log("   (aucun service retourne)")
    }
  } catch (e) {
    ko("Impossible de recuperer les services : " + (e instanceof Error ? e.message : String(e)))
  }

  // 4. Initialisation d'un paiement de test
  step("4. Initialisation d'un paiement de test (100 XOF, staging)")
  const ref = "TEST_" + Date.now()
  const res = await createVersusPayment({
    name: "Test integration Papeterie",
    merchant_name: "Papeterie",
    first_name: "Test",
    last_name: "Integration",
    external_reference: ref,
    order_reference: "ORD-" + ref,
    phone_number: "770000000",
    email: "test@papeterie.sn",
    success_url: "https://papeterie.vercel.app/checkout/success",
    failure_url: "https://papeterie.vercel.app/checkout/failure",
    amount: 100,
    currency: "XOF",
  })

  if (res.success) {
    const link = res.data?.data?.link ?? res.data?.link
    ok("Paiement initie")
    if (link) console.log(`   Lien de paiement : ${link}`)
  } else {
    ko("Echec de l'initialisation : " + (res.message ?? "raison inconnue"))
    process.exit(1)
  }

  console.log("\n\x1b[32mTous les tests Versus sont passes.\x1b[0m")
}

main().catch((e) => {
  console.error("\x1b[31mErreur inattendue :\x1b[0m", e)
  process.exit(1)
})
