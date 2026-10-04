// Controle post-deploiement de la vitrine et des protections de l'API.
// Aucune ecriture, meme sur un ancien build : chaque requete POST est construite pour etre rejetee
// par la validation (kind inconnu, total absent) avant tout acces en ecriture.
//
//   node scripts/verify-deploy.mjs                              -> https://papeterie.vercel.app
//   node scripts/verify-deploy.mjs https://xxx.vercel.app       -> apercu de la branche
//   WEBHOOK_SECRET=... node scripts/verify-deploy.mjs           -> teste aussi le webhook avec le bon secret
//
// Code de sortie 0 si tout est OK, 1 sinon.
const BASE = (process.argv[2] ?? "https://papeterie.vercel.app").replace(/[/]+$/, "")
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET
const MIN_PRODUCTS = 790

const results = []
const check = (name, ok, detail = "") => {
  results.push({ name, ok })
  console.log(`${ok ? "OK  " : "FAIL"} ${name}${detail ? "  -> " + detail : ""}`)
}
// Reessaie sur coupure reseau passagere (timeout de connexion) : evite les faux echecs.
const fetchRetry = async (url, init, tries = 3) => {
  for (let i = 1; ; i++) {
    try { return await fetch(url, init) } catch (e) {
      if (i >= tries) throw e
      await new Promise((r) => setTimeout(r, 1500 * i))
    }
  }
}
const call = async (path, init = {}) => {
  const res = await fetchRetry(BASE + path, { redirect: "manual", ...init })
  let body = null
  try { body = await res.clone().json() } catch { /* pas du JSON */ }
  return { res, body }
}
const json = (method, body, headers = {}) => ({
  method, headers: { "content-type": "application/json", ...headers }, body: JSON.stringify(body),
})

console.log(`Controle de ${BASE}\n`)

// ---- Vitrine
console.log("== Vitrine")
{
  const { res } = await call("/shop")
  check("/shop repond 200", res.status === 200, String(res.status))
  const login = await call("/login")
  check("/login repond 200", login.res.status === 200, String(login.res.status))

  const store = await call("/api/store")
  const storeId = store.body?.id
  check("/api/store renvoie la boutique", !!storeId, store.body?.name)

  const { body } = await call(`/api/stores/${storeId}/products`)
  const products = Array.isArray(body) ? body : (body?.products ?? [])
  check(`catalogue >= ${MIN_PRODUCTS} produits actifs`, products.length >= MIN_PRODUCTS, String(products.length))
  const cats = new Set(products.map((p) => p.category))
  check("13 categories Moukat presentes", ["Livres", "Cahiers", "Sacs & trousses", "Gourdes & boîtes repas", "Bureau"].every((c) => cats.has(c)), `${cats.size} categories`)
  check("produits de demo masques", !products.some((p) => ["Kit geometrie Maped", "Cle USB 32Go", "Colle liquide blanche 60g"].includes(p.name)))
  check("manuels illustres conserves", products.filter((p) => p.image).length >= 20, `${products.filter((p) => p.image).length} avec image`)
  check("aucun prix <= 0", products.every((p) => p.price > 0))
  check("aucun stock negatif", products.every((p) => (p.stock ?? 0) >= 0))
  check("nouvelle version deployee (champ barcode expose)", products.some((p) => p.barcode), "absent = ancien build")
}

// ---- Protections de l'API (ces controles ne creent ni ne modifient rien)
console.log("\n== Securite")
{
  check("GET /api/orders refuse sans session", (await call("/api/orders")).res.status === 401)
  check("GET /api/users refuse sans session", (await call("/api/users")).res.status === 401)

  const upd = await call("/api/orders/update", json("PUT", { id: "x", status: "Delivered" }, { authorization: "Bearer faux" }))
  check("PUT /api/orders/update refuse un faux Bearer", upd.res.status === 401 || upd.res.status === 403, String(upd.res.status))

  const rech = await call("/api/wallet/recharge", json("POST", { amount: 99999 }, { authorization: "Bearer faux" }))
  check("recharge portefeuille refusee", rech.res.status === 401 || rech.res.status === 403, String(rech.res.status))

  const wh = await call("/api/webhooks/versus", json("POST", { type: "TRANSACTION_STATUS", external_reference: "x", status: "COMPLETED" }))
  check("webhook Versus refuse sans secret", wh.res.status === 401, String(wh.res.status))

  if (WEBHOOK_SECRET) {
    const ok = await call("/api/webhooks/versus", json("POST", { type: "PAYMENT_INSTRUCTIONS" }, { "x-versus-signature": WEBHOOK_SECRET }))
    check("webhook Versus accepte le bon secret", ok.res.status === 200, String(ok.res.status))
  } else {
    console.log("SKIP webhook avec bon secret (definir WEBHOOK_SECRET)")
  }

  // kind inconnu : meme avec un code valide, rien n'est cree (400 sur un ancien build, 401 si le code par defaut est refuse)
  const ges = await call("/api/gestion", json("POST", { code: "schoolmatik", kind: "verification-sans-ecriture" }))
  check("/api/gestion refuse l'ancien code par defaut", ges.res.status === 401, String(ges.res.status))

  // Sans "total" : un ancien build repond 400 "total requis" ; le nouveau, 400 "identifiant produit". Aucune commande creee.
  const ord = await call("/api/orders", json("POST", { items: [{ name: "verification", qty: 1 }] }))
  check("commande : prix calcules par le serveur", ord.res.status === 400 && /identifiant produit/i.test(ord.body?.error ?? ""), `${ord.res.status} ${ord.body?.error ?? ""}`)

  const cors = await call("/api/store", { headers: { origin: "https://evil.example" } })
  check("CORS : origine inconnue non autorisee", cors.res.headers.get("access-control-allow-origin") !== "*" && cors.res.headers.get("access-control-allow-origin") !== "https://evil.example", String(cors.res.headers.get("access-control-allow-origin")))
}

const failed = results.filter((r) => !r.ok)
console.log(`\n${results.length - failed.length}/${results.length} controles OK`)
if (failed.length) {
  console.log("A verifier :\n - " + failed.map((f) => f.name).join("\n - "))
  process.exit(1)
}
