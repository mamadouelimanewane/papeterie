// Test de montee en charge (sans dependance).
//
//   node scripts/load-test.mjs http://localhost:3100            -> toutes les phases
//   node scripts/load-test.mjs http://localhost:3100 mixte      -> un seul scenario
//
// A lancer contre une COPIE locale (build de production + base de test), jamais contre le site en ligne :
// cela gene les vrais clients, consomme le quota Neon/Vercel et peut enfreindre les regles d'usage de l'hebergeur.
// Une cible distante est refusee sauf avec --allow-remote (et l'accord prealable de l'hebergeur).
//
// Les scenarios d'ecriture (commande) envoient une adresse IP differente par requete (en-tete x-forwarded-for)
// pour simuler de nombreux clients : sans cela la limitation de debit par IP (20 commandes / 10 min) fausserait la mesure.
import http from "node:http"

const BASE = new URL(process.argv[2] ?? "http://localhost:3100")
const ONLY = process.argv[3] && !process.argv[3].startsWith("--") ? process.argv[3] : null
const DURATION = Number(process.env.PHASE_SECONDS ?? 12) * 1000
const LEVELS = (process.env.LEVELS ?? "10,50,150").split(",").map(Number)
if (!["localhost", "127.0.0.1"].includes(BASE.hostname) && !process.argv.includes("--allow-remote")) {
  console.error("Cible distante refusee : ce test ne doit viser qu'une copie locale (voir l'en-tete du script)."); process.exit(1)
}

const agent = new http.Agent({ keepAlive: true, maxSockets: 1000 })
const rnd = (n) => Math.floor(Math.random() * n)
const fakeIp = () => `10.${rnd(250)}.${rnd(250)}.${1 + rnd(250)}`

function call(method, path, { body, headers = {} } = {}) {
  return new Promise((resolve) => {
    const t0 = performance.now()
    const data = body ? JSON.stringify(body) : null
    const req = http.request({
      agent, method, host: BASE.hostname, port: BASE.port, path,
      headers: { "x-forwarded-for": fakeIp(), ...(data ? { "content-type": "application/json", "content-length": Buffer.byteLength(data) } : {}), ...headers },
    }, (res) => {
      let bytes = 0
      res.on("data", (c) => (bytes += c.length))
      res.on("end", () => resolve({ status: res.statusCode, ms: performance.now() - t0, bytes }))
    })
    req.setTimeout(30000, () => { req.destroy(); resolve({ status: 0, ms: 30000, bytes: 0 }) })
    req.on("error", () => resolve({ status: 0, ms: performance.now() - t0, bytes: 0 }))
    if (data) req.write(data)
    req.end()
  })
}

async function getJson(path) {
  return new Promise((resolve, reject) => http.get({ host: BASE.hostname, port: BASE.port, path, agent }, (r) => {
    let s = ""; r.on("data", (c) => (s += c)); r.on("end", () => { try { resolve(JSON.parse(s)) } catch (e) { reject(e) } })
  }).on("error", reject))
}

const store = await getJson("/api/store")
const products = (await getJson(`/api/stores/${store.id}/products`)).filter((p) => p.stock > 5)
console.log(`Cible ${BASE.origin} · boutique ${store.name} · ${products.length} produits en stock\n`)
const hot = products[0] // produit « star » : forte contention sur le stock

const order = () => call("POST", "/api/orders", {
  body: { items: [{ id: Math.random() < 0.3 ? hot.id : products[rnd(products.length)].id, qty: 1 }], paymentMethod: "Cash", firstName: "Test", phone_number: "770000000", address: "Dakar" },
})

const SCENARIOS = {
  "page-boutique": () => call("GET", "/shop"),
  "catalogue-direct": () => call("GET", "/api/store?products=1"), // ancienne requete, non mise en cache (/gestion)
  "catalogue-vitrine": () => call("GET", "/api/store?products=1&view=shop"), // celle de la vitrine publique
  "image-statique": () => call("GET", "/generic/colle.jpg"),
  "photo-base": null, // renseigne plus bas si une photo existe
  "commande": order,
  "mixte": () => {
    const r = Math.random()
    if (r < 0.2) return call("GET", "/shop")
    if (r < 0.5) return call("GET", "/api/store?products=1&view=shop")
    if (r < 0.85) return call("GET", "/generic/colle.jpg")
    if (r < 0.95) return call("POST", "/api/promo", { body: { code: "RENTREE2026" } })
    return order()
  },
}
delete SCENARIOS["photo-base"]

const pct = (a, p) => a[Math.min(a.length - 1, Math.floor((p / 100) * a.length))]

async function phase(name, fn, conc) {
  const lat = [], status = {}, deadline = performance.now() + DURATION
  let bytes = 0, done = 0
  const t0 = performance.now()
  await Promise.all(Array.from({ length: conc }, async () => {
    while (performance.now() < deadline) {
      const r = await fn()
      lat.push(r.ms); bytes += r.bytes; done++
      status[r.status] = (status[r.status] ?? 0) + 1
    }
  }))
  const secs = (performance.now() - t0) / 1000
  lat.sort((a, b) => a - b)
  const bad = Object.entries(status).filter(([s]) => !(+s >= 200 && +s < 400) && +s !== 400 && +s !== 429).reduce((n, [, c]) => n + c, 0)
  return {
    name, conc, rps: done / secs, p50: pct(lat, 50), p95: pct(lat, 95), p99: pct(lat, 99), max: lat[lat.length - 1],
    err: bad, errPct: (100 * bad) / done, kb: bytes / done / 1024, status,
  }
}

const rows = []
for (const [name, fn] of Object.entries(SCENARIOS)) {
  if (ONLY && ONLY !== name) continue
  const levels = name === "mixte" ? [...LEVELS, 300] : LEVELS
  for (const c of levels) {
    const r = await phase(name, fn, c)
    rows.push(r)
    console.log(`${name.padEnd(15)} conc=${String(c).padEnd(4)} ${r.rps.toFixed(0).padStart(5)} req/s  p50 ${r.p50.toFixed(0).padStart(5)} ms  p95 ${r.p95.toFixed(0).padStart(5)} ms  p99 ${r.p99.toFixed(0).padStart(5)} ms  erreurs ${r.err} (${r.errPct.toFixed(1)}%)  ${r.kb.toFixed(1)} Ko/rep  ${JSON.stringify(r.status)}`)
  }
}
