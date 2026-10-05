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

// reglages generaux : lecture + ecriture fusionnee (le PUT remplace tout l'objet)
async function setGeneral(patch) {
  const cur = (await req("GET", "/api/admin/settings/general", { jar: admin.jar })).json?.value ?? {}
  const r = await req("PUT", "/api/admin/settings/general", { body: { value: { ...cur, ...patch } }, jar: admin.jar })
  return r.status
}

section("0b. Promotions : desactivees par defaut")
const cfg0 = (await req("GET", "/api/shop/config")).json
ok("codes promo desactives par defaut (champ masque dans le panier)", cfg0?.promotionsEnabled === false, JSON.stringify({ promotionsEnabled: cfg0?.promotionsEnabled }))
const prOff = await req("POST", "/api/promo", { body: { code: "RENTREE2026" } })
ok("validation d'un code refusee tant que les promos sont desactivees", prOff.json?.valid === false && prOff.json?.disabled === true)
const listPublic = await req("GET", "/api/promo-codes")
ok("la liste des codes promo n'est plus publique", listPublic.status === 401, "HTTP " + listPublic.status)

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
// commande avec code promo alors que les promos sont desactivees : refusee
const offTry = await order([{ id: pB.id, qty: 1 }], { promoCode: "RENTREE2026" })
ok("commande avec code promo refusee quand les promos sont desactivees", offTry.status === 400 && /d.sactiv/i.test(offTry.json?.error ?? ""), `HTTP ${offTry.status} ${offTry.json?.error ?? ""}`)
// l'administrateur reactive les promotions (reversible a tout moment)
ok("l'admin reactive les codes promo (Parametres)", (await setGeneral({ promotionsEnabled: true })) === 200)
const cfg1 = (await req("GET", "/api/shop/config")).json
ok("codes promo reactives : visibles dans la vitrine", cfg1?.promotionsEnabled === true)
const pr = await req("POST", "/api/promo", { body: { code: "rentree2026" } })
ok("code promo valide (insensible a la casse)", pr.json?.valid === true && pr.json?.discount === 15)
const prBad = await req("POST", "/api/promo", { body: { code: "FAUX" } })
ok("code promo invalide refuse", prBad.json?.valid === false)
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

section("9. Livraison selon la distance")
const PLATEAU = { lat: 14.6928, lng: -17.4467 } // position de la boutique (Dakar-Plateau)
// a) tarif fixe (defaut) : honore le reglage « frais de base »
ok("tarif fixe : frais de base reglables (700 F)", (await setGeneral({ promotionsEnabled: false, deliveryMode: "Fixed", defaultDeliveryFee: 700 })) === 200)
await new Promise((r) => setTimeout(r, 100))
// le cache de reglages (30 s) est vide par le PUT : la commande suivante voit le nouveau tarif
const fx = await order([{ id: pA.id, qty: 1 }])
ok("commande en tarif fixe : livraison = 700 F", fx.status === 201 && fx.json.deliveryFee === 700, "livraison " + fx.json?.deliveryFee)

// b) mode Distance
ok("l'admin active le mode Distance (boutique a Dakar-Plateau)", (await setGeneral({ deliveryMode: "Distance", deliveryStoreLat: PLATEAU.lat, deliveryStoreLng: PLATEAU.lng, defaultDeliveryFee: 500, deliveryBaseKm: 2, deliveryPerKm: 150, deliveryMaxKm: 25, deliveryMaxFee: 5000, deliveryRoadFactor: 1.3, deliveryFreeAbove: 0 })) === 200)
const quote = async (lat, lng, goods = 3000) => req("POST", "/api/delivery/quote", { body: { lat, lng, goods } })
const near = await quote(14.6930, -17.4460)
ok("a 100 m de la boutique : frais de base 500 F", near.json?.fee === 500 && near.json?.mode === "Distance", JSON.stringify(near.json))
const almadies = await quote(14.7450, -17.5220) // ~10 km a vol d'oiseau
ok("Dakar-Plateau -> Almadies : ~13 km par la route, 2 150 F", almadies.json?.fee === 2150 && almadies.json.distanceKm > 12 && almadies.json.distanceKm < 14, JSON.stringify(almadies.json))
const sacre = await quote(14.7167, -17.4677) // Medina / Point E : ~3,5 km
ok("trajet court (~3-4 km) : frais intermediaires", sacre.json?.fee > 500 && sacre.json?.fee < 1000, JSON.stringify(sacre.json))
const rufisque = await quote(14.7150, -17.2730) // Rufisque : ~20 km a vol d'oiseau
ok("Rufisque (~25 km par la route) : plafonne ou hors zone", rufisque.status === 422 || rufisque.json?.fee <= 5000, JSON.stringify(rufisque.json))
const thies = await quote(14.7910, -16.9260)
ok("Thies (~56 km) : hors zone de livraison", thies.status === 422 && thies.json?.code === "HORS_ZONE", thies.json?.error)
const paris = await quote(48.8566, 2.3522)
ok("position hors du Senegal refusee", paris.status === 400 && paris.json?.code === "POSITION_INVALIDE")
const nopos = await quote(undefined, undefined)
ok("pas de position en mode Distance : demandee", nopos.status === 422 && nopos.json?.code === "POSITION_REQUISE")

// c) commandes
const noPoint = await order([{ id: pA.id, qty: 1 }])
ok("commande sans position refusee en mode Distance", noPoint.status === 400 && /position/i.test(noPoint.json?.error ?? ""), noPoint.json?.error)
const farOrder = await order([{ id: pA.id, qty: 1 }], { deliveryLat: 14.7910, deliveryLng: -16.9260 })
ok("commande hors zone refusee", farOrder.status === 400 && /zone/i.test(farOrder.json?.error ?? ""), farOrder.json?.error)
const badGeo = await order([{ id: pA.id, qty: 1 }], { deliveryLat: 48.85, deliveryLng: 2.35 })
ok("commande avec position hors Senegal refusee", badGeo.status === 400)
const tamper = await order([{ id: pA.id, qty: 1 }], { deliveryLat: 14.7450, deliveryLng: -17.5220, deliveryFee: 0, total: 1, subtotal: 1 })
ok("frais envoyes par le client (0 F) ignores : recalcul serveur 2 150 F", tamper.status === 201 && tamper.json.deliveryFee === 2150 && tamper.json.total === pA.price + 2150, "livraison " + tamper.json?.deliveryFee + ", total " + tamper.json?.total)
const noteTag = (await q(`SELECT notes FROM "Order" WHERE id=$1`, [tamper.json.id]))[0].notes
ok("distance et position GPS enregistrees sur la commande", /\[Livraison: [\d,]+ km · GPS 14\.7450\d*,-17\.5220\d*\]/.test(noteTag), noteTag?.match(/\[Livraison[^\]]*\]/)?.[0])

// d) livreur : vraie distance dans la liste, GPS apres acceptation, frais verses
const H = { authorization: `Bearer ${driverToken}` }
const pool = await req("GET", "/api/driver/orders/available", { headers: H })
const inPool = (pool.json ?? []).find((o) => o._id === tamper.json.id)
ok("liste livreur : distance reelle (plus de valeur aleatoire) et gain = frais", inPool && /km/.test(inPool.distance) && inPool.earnings === 2150, JSON.stringify({ distance: inPool?.distance, earnings: inPool?.earnings }))
const acc2 = await req("POST", `/api/driver/orders/${tamper.json.id}/accept`, { headers: H })
ok("apres acceptation : position GPS du client transmise au livreur", acc2.status === 200 && Math.abs(acc2.json?.deliveryGps?.lat - 14.745) < 0.001 && acc2.json?.deliveryDistanceKm > 12, JSON.stringify({ gps: acc2.json?.deliveryGps, km: acc2.json?.deliveryDistanceKm }))

// e) codes de livraison : 5 essais errones par commande
const pick2 = (await q(`SELECT "pickupOtp" FROM "Order" WHERE id=$1`, [tamper.json.id]))[0].pickupOtp
await req("PUT", `/api/driver/orders/${tamper.json.id}/status`, { body: { status: "PickedUp", otp: pick2 }, headers: H })
const tries = []
for (let i = 0; i < 6; i++) tries.push((await req("PUT", `/api/driver/orders/${tamper.json.id}/status`, { body: { status: "Delivered", otp: String(100000 + i) }, headers: H })).status)
ok("codes de livraison : verrouillage apres 5 essais errones", tries.slice(0, 5).every((x) => x === 400) && tries[5] === 429, tries.join(" "))
const goodAfterLock = await req("PUT", `/api/driver/orders/${tamper.json.id}/status`, { body: { status: "Delivered", otp: (await q(`SELECT "deliveryOtp" FROM "Order" WHERE id=$1`, [tamper.json.id]))[0].deliveryOtp }, headers: H })
ok("meme le bon code est refuse pendant le verrouillage (15 min)", goodAfterLock.status === 429)

// f) livraison offerte au-dessus d'un montant
await setGeneral({ deliveryFreeAbove: 20000 })
const big = await order([{ id: pB.id, qty: 10 }], { deliveryLat: 14.7450, deliveryLng: -17.5220 })
ok("livraison offerte au-dessus du seuil (20 000 F d'articles)", big.status === 201 && big.json.deliveryFee === 0 && big.json.total === big.json.subtotal, "articles " + big.json?.subtotal + ", livraison " + big.json?.deliveryFee)

// g) retour au tarif fixe : tout fonctionne sans position
await setGeneral({ deliveryMode: "Fixed", deliveryFreeAbove: 0, defaultDeliveryFee: 500 })
const back = await order([{ id: pA.id, qty: 1 }])
ok("retour au tarif fixe : commande sans position acceptee, 500 F", back.status === 201 && back.json.deliveryFee === 500)

section("10. Applications installables (PWA) et espace livreur")
for (const [app, path, color] of [["client", "/shop", "#4F46E5"], ["livreur", "/livreur", "#059669"], ["admin", "/dashboard", "#111827"]]) {
  const m = await req("GET", `/pwa/${app}.webmanifest`)
  const j = m.json ?? {}
  const sizes = (j.icons ?? []).map((i) => i.sizes + "/" + i.purpose)
  ok(`manifeste ${app} : nom, adresse de depart, mode application, icones 192 / 512 / maskable`,
    m.status === 200 && /manifest\+json/.test(m.headers["content-type"] ?? "") && j.display === "standalone" && j.start_url?.startsWith(path) && j.theme_color === color &&
      sizes.includes("192x192/any") && sizes.includes("512x512/any") && sizes.includes("512x512/maskable"), `${j.name} · ${j.start_url} · portee ${j.scope}`)
  const icons = await Promise.all((j.icons ?? []).map((i) => req("GET", i.src)))
  ok(`icones ${app} accessibles sans connexion`, icons.length === 3 && icons.every((r) => r.status === 200 && /image\/png/.test(r.headers["content-type"] ?? "")))
}
const swr = await req("GET", "/sw.js")
ok("service worker accessible sans connexion, jamais mis en cache par le navigateur", swr.status === 200 && /javascript/.test(swr.headers["content-type"] ?? "") && /no-cache|no-store/.test(swr.headers["cache-control"] ?? "") && /\/api\//.test(swr.text), swr.headers["cache-control"])
ok("le service worker ne met jamais l'API en cache", /startsWith\("\/api\/"\)\) return/.test(swr.text))
ok("page hors connexion et page « Installer » publiques", (await req("GET", "/offline.html")).status === 200 && (await req("GET", "/installer")).status === 200)
const cl = await req("GET", "/client"), ad = await req("GET", "/admin")
ok("adresses courtes : /client -> boutique, /admin -> administration", [307, 308].includes(cl.status) && /\/shop/.test(cl.headers.location ?? "") && [307, 308].includes(ad.status) && /\/dashboard/.test(ad.headers.location ?? ""), `${cl.headers.location} | ${ad.headers.location}`)
for (const [name, path] of [["boutique", "/shop"], ["livreur", "/livreur"], ["connexion admin", "/login"]]) {
  const html = (await req("GET", path)).text
  ok(`page ${name} : lien vers le manifeste et icone iOS`, /rel="manifest"/.test(html) && /apple-touch-icon|apple-mobile-web-app/i.test(html) && /pwa\/(client|livreur|admin)\.webmanifest/.test(html))
}
const livreurHtml = (await req("GET", "/livreur")).text
ok("la page livreur n'affiche plus de mot de passe de demonstration", !/Demo2024|livreur@papeterie/i.test(livreurHtml))
ok("commande en cours : sans session = 401", (await req("GET", "/api/driver/orders/active")).status === 401)
const act = await req("GET", "/api/driver/orders/active", { headers: H })
const mine = (act.json ?? []).find((o) => o._id === tamper.json.id)
ok("commande en cours du livreur : client, GPS et gain, sans aucun code de securite", mine && mine.customerName === "Awa" && /771110000/.test(mine.customerPhone) && Math.abs(mine.deliveryGps?.lat - 14.745) < 0.001 && mine.earnings === 2150 && !("pickupOtp" in mine) && !("deliveryOtp" in mine) && !/\b\d{6}\b/.test(JSON.stringify({ ...mine, id: undefined, _id: undefined, customerPhone: undefined })), JSON.stringify({ statut: mine?.status, client: mine?.customerName, gain: mine?.earnings }))
const histo = await req("GET", "/api/driver/orders/history", { headers: H })
ok("historique livreur : aucun code de securite renvoye", Array.isArray(histo.json) && histo.json.every((o) => !("pickupOtp" in o) && !("deliveryOtp" in o) && !("signature" in o)))
const earn = await req("GET", "/api/driver/earnings", { headers: H })
ok("gains du jour calcules sur les frais reels (plus de forfait fictif de 500 F)", earn.status === 200 && earn.json?.todayEarnings === (await q(`SELECT coalesce(sum("deliveryFee"),0)::int s FROM "Order" WHERE "driverId"=$1 AND status IN ('Delivered','Completed')`, [driverId]))[0].s, JSON.stringify({ jour: earn.json?.todayEarnings, livraisons: earn.json?.todayOrders }))

const failed = results.filter((r) => !r.ok)
console.log(`\n${results.length - failed.length}/${results.length} controles OK`)
if (failed.length) console.log("A corriger :\n - " + failed.map((f) => f.name).join("\n - "))
await db.end()
