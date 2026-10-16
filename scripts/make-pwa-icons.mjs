// Genere les icones des trois applications installables (client, livreur, admin) dans public/pwa/,
// a partir du logo Schoolmatik (public/brand/schoolmatik-logo-512.png).
// A relancer uniquement pour changer le design :  node scripts/make-pwa-icons.mjs
// Utilise sharp (deja present via Next.js). Les PNG generes sont versionnes : pas de dependance a l'execution.
import sharp from "sharp"
import { mkdirSync } from "node:fs"

const LOGO = "public/brand/schoolmatik-logo-512.png"
// Bandeau sous le logo pour distinguer les applications sur l'ecran d'accueil (client : logo seul)
const APPS = {
  client: { band: null },
  livreur: { band: { text: "LIVREUR", color: "#C61620" } },
  admin: { band: { text: "ADMIN", color: "#111827" } },
}

const S = 512
/** Icone 512 px : fond blanc (coins arrondis sauf maskable/iOS), logo centre, bandeau optionnel. */
async function icon(app, { maskable }) {
  const { band } = APPS[app]
  // maskable : le contenu reste dans la zone de securite centrale (~80 %)
  const area = maskable ? 0.72 : 0.9
  const logoSize = Math.round(S * area * (band ? 0.8 : 1))
  const bandH = band ? Math.round(S * area * 0.2) : 0
  const top = Math.round((S - logoSize - bandH) / 2)
  const radius = maskable ? 0 : 112
  const base = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}"><rect width="${S}" height="${S}" rx="${radius}" fill="#ffffff"/></svg>`)
  const layers = [{ input: await sharp(LOGO).resize(logoSize, logoSize, { fit: "contain", background: "#ffffff" }).png().toBuffer(), top, left: Math.round((S - logoSize) / 2) }]
  if (band) {
    const w = Math.round(S * area)
    const svgBand = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${bandH}"><rect width="${w}" height="${bandH}" rx="${Math.round(bandH / 3)}" fill="${band.color}"/><text x="${w / 2}" y="${Math.round(bandH * 0.72)}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="${Math.round(bandH * 0.62)}" letter-spacing="6" fill="#ffffff">${band.text}</text></svg>`
    layers.push({ input: Buffer.from(svgBand), top: top + logoSize, left: Math.round((S - w) / 2) })
  }
  return sharp(base).composite(layers).png().toBuffer()
}

mkdirSync("public/pwa", { recursive: true })
for (const app of Object.keys(APPS)) {
  const normal = await icon(app, { maskable: false })
  const maskable = await icon(app, { maskable: true })
  await sharp(normal).resize(192, 192).png().toFile(`public/pwa/${app}-192.png`)
  await sharp(normal).resize(512, 512).png().toFile(`public/pwa/${app}-512.png`)
  await sharp(maskable).resize(512, 512).png().toFile(`public/pwa/${app}-maskable-512.png`)
  // iOS : icone d'ecran d'accueil pleine surface (iOS applique lui-meme les coins arrondis)
  await sharp(maskable).resize(180, 180).png().toFile(`public/pwa/${app}-180.png`)
  console.log("icones :", app)
}
