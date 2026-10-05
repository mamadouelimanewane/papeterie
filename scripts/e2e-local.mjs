// Scenario de bout en bout (experience client + finances), sur une COPIE LOCALE uniquement.
//
//   1. demarrer Postgres de test + `next start -p 3100`  (variables : DATABASE_URL, VERSUS_WEBHOOK_SECRET=wh-secret,
//      ADMIN_EMAIL=admin@test.local, ADMIN_PASSWORD=Test-Admin-123, NEXTAUTH_SECRET)
//   2. node --env-file=.env.test scripts/e2e-local.mjs http://localhost:3100
//
// Le script cree des comptes, des commandes et des mouvements d'argent : il refuse toute cible distante.
import http from "node:http"
import pg from "pg"
import bcrypt from "bcryptjs"

const BASE = new URL(process.argv[2] ?? "http://localhost:3100")
if (!["localhost", "127.0.0.1"].includes(BASE.hostname)) { console.error("Cible distante refusee."); process.exit(1) }
const WH = "wh-secret"
const db = new pg.Client({ connectionString: process.env.DATABASE_URL })
await db.connect()
const q = async (sql, params = []) => (await db.query(sql, params)).rows

const results = []
const ok = (name, cond, detail = "") => { results.push({ name, ok: !!cond }); console.log(`${cond ? "OK  " : "FAIL"} ${name}${detail ? "  -> " + detail : ""}`) }
const info = (s) => console.log(`     ${s}`)
const section = (s) => console.log(`\n== ${s}`)
const fcfa = (n) => Number(n).toLocaleString("fr-FR") + " F"

// ---- client HTTP minimal avec cookies (NextAuth)
function req(method, path, { body, headers = {}, jar } = {}) {
  return new Promise((resolve, reject) => {
    const data = body === undefined ? null : typeof body === "string" ? body : JSON.stringify(body)
    const h = { "x-forwarded-for": `10.9.${Math.floor(Math.random() * 250)}.${1 + Math.floor(Math.random() * 250)}`, ...headers }
    if (data) { h["content-type"] = h["content-type"] ?? "application/json"; h["content-length"] = Buffer.byteLength(data) }
    if (jar?.cookie) h.cookie = jar.cookie
    const r = http.request({ host: BASE.hostname, port: BASE.port, method, path, headers: h }, (res) => {
      let s = ""
      res.on("data", (c) => (s += c))
      res.on("end", () => {
        if (jar && res.headers["set-cookie"]) {
          const m = new Map((jar.cookie ?? "").split("; ").filter(Boolean).map((c) => c.split(/=(.*)/s).slice(0, 2)))
          for (const c of res.headers["set-cookie"]) { const [kv] = c.split(";"); const [k, v] = kv.split(/=(.*)/s); if (v) m.set(k, v); else m.delete(k) }
          jar.cookie = [...m].map(([k, v]) => `${k}=${v}`).join("; ")
        }
        let json = null; try { json = JSON.parse(s) } catch { /* html */ }
        resolve({ status: res.statusCode, json, text: s, headers: res.headers })
      })
    })
    r.on("error", reject)
    if (data) r.write(data)
    r.end()
  })
}
async function login(provider, fields) {
  const jar = { cookie: "" }
  const c = await req("GET", "/api/auth/csrf", { jar })
  const body = new URLSearchParams({ csrfToken: c.json.csrfToken, json: "true", ...fields }).toString()
  await req("POST", `/api/auth/callback/${provider}`, { body, headers: { "content-type": "application/x-www-form-urlencoded" }, jar })
  const s = await req("GET", "/api/auth/session", { jar })
  return { jar, user: s.json?.user }
}

// ---- preparation
section("0. Preparation (comptes de test, code promo)")
const store = (await q(`SELECT id, name FROM "Store" ORDER BY "createdAt" LIMIT 1`))[0]
await q(`UPDATE "Store" SET password=$1, "walletMoney"=0 WHERE id=$2`, [bcrypt.hashSync("Marchand-123", 10), store.id])
await q(`INSERT INTO "PromoCode"(id, code, discount, type, status, "updatedAt") VALUES ('promo-e2e','RENTREE2026',15,'Percentage','Active', now()) ON CONFLICT (code) DO NOTHING`)
const driverReg = await req("POST", "/api/driver/register", { body: { name: "Livreur E2E", email: "livreur-e2e@test.local", phone: "779990000", password: "Livreur-12345", vehicleType: "Moto" } })
await q(`UPDATE "Driver" SET "approvalStatus"='Approved', status='Online' WHERE email='livreur-e2e@test.local'`)
const dl = await req("POST", "/api/driver/login", { body: { email: "livreur-e2e@test.local", password: "Livreur-12345" } })
const driverToken = dl.json?.token
const driverId = dl.json?.driver?.id
ok("livreur inscrit, approuve, connecte", !!driverToken)
const ur = await req("POST", "/api/user/register", { body: { name: "Awa Client", email: "awa@test.local", phone: "771110000", password: "Client-12345" } })
const ul = await req("POST", "/api/user/login", { body: { email: "awa@test.local", password: "Client-12345" } })
const userToken = ul.json?.token
ok("client inscrit et connecte (application mobile)", !!userToken, `HTTP ${ur.status}/${ul.status}`)
const admin = await login("credentials", { email: "admin@test.local", password: "Test-Admin-123" })
const merchant = await login("merchant", { email: "contact@schoolmatik.sn", password: "Marchand-123" })
ok("admin et marchand connectes", admin.user?.role === "admin" && merchant.user?.role === "merchant")

// ---- experience client
section("1. Experience client (vitrine)")
const t0 = Date.now(); const shop = await req("GET", "/shop"); ok("page boutique", shop.status === 200, `${Date.now() - t0} ms`)
const cat = await req("GET", "/api/store?products=1&view=shop")
const products = (cat.json?.products ?? []).filter((p) => p.stock > 10 && p.price > 0)
ok("catalogue charge", (cat.json?.products ?? []).length > 700, `${(cat.json?.products ?? []).length} produits, ${(cat.text.length / 1024).toFixed(0)} Ko`)
const noPhoto = products.filter((p) => !p.image).length
info(`${products.length - noPhoto} produits avec image, ${noPhoto} sans (pictogramme)`)
const bad = products.filter((p) => !(p.price > 0) || !p.name || p.name.length > 120)
ok("donnees produit propres (prix > 0, nom raisonnable)", bad.length === 0, `${bad.length} anomalie(s)`)
const pr = await req("POST", "/api/promo", { body: { code: "rentree2026" } })
ok("code promo valide (insensible a la casse)", pr.json?.valid === true && pr.json?.discount === 15)
const prBad = await req("POST", "/api/promo", { body: { code: "FAUX" } })
ok("code promo invalide refuse", prBad.json?.valid === false)
const pA = products[10], pB = products[200], pC = products[300]

// ---- commandes
section("2. Commandes")
async function order(items, extra = {}, headers = {}) {
  const r = await req("POST", "/api/orders", { body: { items, paymentMethod: "Cash", firstName: "Awa", phone_number: "771110000", address: "Dakar, Plateau", ...extra }, headers })
  return r
}
const sumItems = (arr) => arr.reduce((s, [p, n]) => s + p.price * n, 0)
const itemsA = [[pA, 2], [pB, 1]]; const sA = sumItems(itemsA)
const oA = await order(itemsA.map(([p, n]) => ({ id: p.id, qty: n })))
ok("A : commande invite, espèces", oA.status === 201 && oA.json.total === sA + 500, `articles ${fcfa(sA)} + livraison 500 = ${fcfa(oA.json?.total)}`)
const itemsB = [[pB, 3]]; const sB = sumItems(itemsB)
const oB = await order(itemsB.map(([p, n]) => ({ id: p.id, qty: n })), { promoCode: "RENTREE2026" }, { authorization: `Bearer ${userToken}` })
const discB = Math.round((sB * 15) / 100)
ok("B : client connecte + promo 15 %", oB.status === 201 && oB.json.total === sB - discB + 500, `articles ${fcfa(sB)} - remise ${fcfa(discB)} + 500 = ${fcfa(oB.json?.total)}`)
const itemsC = [[pC, 2]]; const sC = sumItems(itemsC)
const oC = await order(itemsC.map(([p, n]) => ({ id: p.id, qty: n })), { paymentMethod: "Wave" })
ok("C : commande payee en ligne (Wave)", oC.status === 201, `${fcfa(oC.json?.total)} · paiement initie : ${oC.json?.paymentInitiated} (${oC.json?.paymentError ? "Versus non configure en local" : "ok"})`)
const wh = (b) => req("POST", "/api/webhooks/versus", { body: b, headers: { "x-versus-signature": WH } })
await wh({ type: "TRANSACTION_STATUS", external_reference: oC.json.id, status: "COMPLETED", amount: String(oC.json.total), reference: "WAVE-E2E-1" })
const oD = await order([{ id: pC.id, qty: 1 }], { paymentMethod: "Wave" })
await wh({ type: "TRANSACTION_STATUS", external_reference: oD.json.id, status: "FAILED", reference: "WAVE-E2E-2" })
const stateD = (await q(`SELECT status, "paymentStatus" FROM "Order" WHERE id=$1`, [oD.json.id]))[0]
ok("D : paiement refuse -> commande annulee", stateD.status === "Annule", JSON.stringify(stateD))

// ---- suivi client
section("3. Suivi par le client")
const mo = await req("POST", "/api/shop/my-orders", { body: { phone: "771110000", orderIds: [oA.json.orderId, oC.json.orderId] } })
ok("« Mes commandes » par numero de telephone", mo.json?.orders?.length === 2, `${mo.json?.orders?.length} commande(s)`)
const moBad = await req("POST", "/api/shop/my-orders", { body: { phone: "779999999", orderIds: [oA.json.orderId] } })
ok("un autre numero ne voit pas la commande", (moBad.json?.orders ?? []).length === 0)

// ---- livraison
section("4. Livraison par le livreur")
const deliver = async (o) => {
  const H = { authorization: `Bearer ${driverToken}` }
  const av = await req("GET", "/api/driver/orders/available", { headers: H })
  const acc = await req("POST", `/api/driver/orders/${o.json.id}/accept`, { headers: H })
  const pick = (await q(`SELECT "pickupOtp" FROM "Order" WHERE id=$1`, [o.json.id]))[0].pickupOtp // donne par la boutique
  const p1 = await req("PUT", `/api/driver/orders/${o.json.id}/status`, { body: { status: "PickedUp", otp: pick }, headers: H })
  const code = (await req("POST", "/api/shop/my-orders", { body: { phone: "771110000", orderIds: [o.json.orderId] } })).json?.orders?.[0]?.deliveryCode // donne par le client
  const badOtp = await req("PUT", `/api/driver/orders/${o.json.id}/status`, { body: { status: "Delivered", otp: "000000" }, headers: H })
  const p2 = await req("PUT", `/api/driver/orders/${o.json.id}/status`, { body: { status: "Delivered", otp: code }, headers: H })
  return { listed: Array.isArray(av.json), acc: acc.status, p1: p1.status, badOtp: badOtp.status, p2: p2.status }
}
for (const [label, o] of [["A", oA], ["B", oB], ["C", oC]]) {
  const r = await deliver(o)
  ok(`${label} : acceptee, ramassee (code boutique), livree (code client)`, r.acc === 200 && r.p1 === 200 && r.p2 === 200 && r.badOtp === 400, JSON.stringify(r))
}

// ---- finances : comptabilite d'une commande
section("5. Finances : ou va l'argent ? (par commande)")
const rows = await q(`SELECT "orderId", subtotal, total, "deliveryFee", earning, status, "paymentStatus", "paymentMethod" FROM "Order" WHERE id = ANY($1)`, [[oA.json.id, oB.json.id, oC.json.id]])
let platformNet = 0
for (const r of rows.sort((a, b) => a.orderId.localeCompare(b.orderId))) {
  const storePayable = r.subtotal - r.earning
  const margin = r.total - storePayable - r.deliveryFee
  platformNet += margin
  info(`${r.orderId.slice(-8)} · client paie ${fcfa(r.total)} (${r.paymentMethod}/${r.paymentStatus}) → boutique ${fcfa(storePayable)} + livreur ${fcfa(r.deliveryFee)} + plateforme ${fcfa(margin)}  [commission affichee ${fcfa(r.earning)}]`)
}
const promoLoss = rows.filter((r) => r.total < r.subtotal + r.deliveryFee).length
const negative = rows.filter((r) => r.total - (r.subtotal - r.earning) - r.deliveryFee < 0)
if (negative.length) console.log(`WARN decision a prendre : ${negative.length} commande(s) remisee(s) font perdre de l'argent a la plateforme (remise promo > commission) ; marge totale ${fcfa(platformNet)}`)
else console.log(`     marge totale plateforme ${fcfa(platformNet)}`)

console.log("     NOTE espèces : pour A et B le livreur a encaisse " + fcfa(rows.filter((r) => r.paymentMethod === "Cash").reduce((s, r) => s + r.total, 0)) + " auprès du client ; l'application ne suit pas ce que le livreur doit reverser à la plateforme.")
section("6. Finances : portefeuilles et rapports")
const drv = (await q(`SELECT "walletMoney", earning, "totalOrders" FROM "Driver" WHERE id=$1`, [driverId]))[0]
ok("livreur credite de ses frais (3 x 500 F)", drv.walletMoney === 1500 && drv.earning === 1500 && drv.totalOrders === 3, JSON.stringify(drv))
const dupe = (await q(`SELECT count(*)::int n FROM "Transaction" WHERE "driverId"=$1 AND method='Livraison'`, [driverId]))[0].n
ok("un seul credit livreur par livraison", dupe === 3, `${dupe} transactions`)
const sw = (await q(`SELECT "walletMoney" FROM "Store" WHERE id=$1`, [store.id]))[0].walletMoney
const owed = rows.reduce((s, r) => s + (r.subtotal - r.earning), 0)
ok("le portefeuille de la boutique est credite des ventes livrees (articles - commission)", Math.round(sw) === Math.round(owed), `solde ${fcfa(sw)} alors que ${fcfa(owed)} lui reviennent sur ces 3 commandes`)
const dash = await req("GET", "/api/dashboard/stats", { jar: admin.jar })
const dRev = dash.json?.site?.totalRevenue
ok("tableau de bord : chiffre d'affaires des commandes livrees", Number(dRev) > 0, `affiche ${fcfa(dRev ?? 0)}`)
const rep = await req("GET", "/api/admin/reports/earnings", { jar: admin.jar })
const repRows = rep.json?.rows ?? []
const repD = repRows.find((r) => r.orderId === oD.json.orderId)
ok("rapport des revenus : commande annulee exclue (statut « Annule »)", repD && repD.platformEarning === 0, `commission comptee sur la commande annulee : ${fcfa(repD?.platformEarning ?? 0)}`)
const put = await req("PUT", "/api/admin/settings/general", { body: { value: { commissionPct: 20 } }, jar: admin.jar })
ok("l'admin change la commission a 20 % (Parametres)", put.status === 200, `HTTP ${put.status}`)
const putBad = await req("PUT", "/api/admin/settings/general", { body: { value: { commissionPct: 250 } }, jar: admin.jar })
ok("une commission de 250 % est refusee", putBad.status === 400)
const oE = await order([{ id: pA.id, qty: 1 }])
const earnE = (await q(`SELECT earning, subtotal FROM "Order" WHERE id=$1`, [oE.json.id]))[0]
ok("la commission configuree (20 %) est appliquee aux nouvelles commandes", Math.round(earnE.earning) === Math.round(earnE.subtotal * 0.2), `commission enregistree ${fcfa(earnE.earning)} sur ${fcfa(earnE.subtotal)} (${Math.round((100 * earnE.earning) / earnE.subtotal)} %)`)

section("7. Retraits (boutique)")
const w0 = await req("GET", "/api/merchant/wallet", { jar: merchant.jar })
const rq = await req("POST", "/api/merchant/wallet", { body: { amount: 1000, method: "Wave", account: "770000001" }, jar: merchant.jar })
ok("la boutique peut demander un retrait de ses ventes", rq.status === 201, `solde ${fcfa(w0.json?.walletMoney)} -> HTTP ${rq.status} ${rq.json?.error ?? ""}`)
await q(`UPDATE "Transaction" SET status='Rejected' WHERE type='Retrait' AND status='Pending'`)
// solde fixe a 5 000 F pour tester la course entre deux approbations
await q(`UPDATE "Store" SET "walletMoney"=5000 WHERE id=$1`, [store.id])
const r1 = await req("POST", "/api/merchant/wallet", { body: { amount: 3000, method: "Wave", account: "770000001" }, jar: merchant.jar })
const r2 = await req("POST", "/api/admin/wallet/cashout", { body: { party: "store", id: store.id, amount: 3000, method: "Wave", account: "770000002" }, jar: admin.jar }) // l'admin peut empiler une 2e demande
const [a1, a2] = await Promise.all([
  req("PATCH", `/api/admin/wallet/cashout/${r1.json?.id}`, { body: { action: "approve" }, jar: admin.jar }),
  req("PATCH", `/api/admin/wallet/cashout/${r2.json?.id}`, { body: { action: "approve" }, jar: admin.jar }),
])
const sw2 = (await q(`SELECT "walletMoney" FROM "Store" WHERE id=$1`, [store.id]))[0].walletMoney
ok("deux retraits simultanes ne depassent pas le solde (5 000 F)", sw2 >= 0 && [a1.status, a2.status].filter((x) => x === 200).length === 1, `statuts ${a1.status}/${a2.status} · solde final ${fcfa(sw2)}`)

section("8. Securite financiere")
await q(`INSERT INTO "Role"(id,name,permissions,"updatedAt") VALUES ('r-rep','Rapports',$1,now()) ON CONFLICT DO NOTHING`, [JSON.stringify(["reports.view"])])
await q(`INSERT INTO "Admin"(id,name,email,password,role,status,"updatedAt") VALUES ('a-rep','Lecteur','lecteur@test.local',$1,'Rapports','Active',now()) ON CONFLICT DO NOTHING`, [bcrypt.hashSync("Lecteur-12345", 10)])
const reader = await login("credentials", { email: "lecteur@test.local", password: "Lecteur-12345" })
const uid = (await q(`SELECT id FROM "User" WHERE email='awa@test.local'`))[0].id
const abuse = await req("POST", "/api/transactions", { body: { userId: uid, amount: 100000, type: "Credit", description: "x" }, jar: reader.jar })
ok("un compte « lecture des rapports » ne peut pas crediter un portefeuille", abuse.status === 403, `HTTP ${abuse.status}`)
const bal = (await q(`SELECT "walletMoney" FROM "User" WHERE id=$1`, [uid]))[0].walletMoney
info(`solde du client apres la tentative : ${fcfa(bal)}`)

const failed = results.filter((r) => !r.ok)
console.log(`\n${results.length - failed.length}/${results.length} controles OK`)
if (failed.length) console.log("A corriger :\n - " + failed.map((f) => f.name).join("\n - "))
await db.end()
