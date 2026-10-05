// Genere les icones des trois applications installables (client, livreur, admin) dans public/pwa/.
// A relancer uniquement pour changer le design :  node scripts/make-pwa-icons.mjs
// Utilise sharp (deja present via Next.js). Les PNG generes sont versionnes : pas de dependance a l'execution.
import sharp from "sharp"
import { mkdirSync } from "node:fs"

const APPS = {
  client: { a: "#6366F1", b: "#4338CA", glyph: "S", sub: "" },
  livreur: { a: "#10B981", b: "#047857", glyph: "L", sub: "" },
  admin: { a: "#374151", b: "#111827", glyph: "A", sub: "ADMIN" },
}

// 100 % de la surface ; « maskable » : le contenu reste dans la zone de securite centrale (80 %)
function svg(app, { maskable }) {
  const { a, b, glyph, sub } = APPS[app]
  const s = 512
  const scale = maskable ? 0.74 : 1
  const radius = maskable ? 0 : 112
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs>
  <rect width="${s}" height="${s}" rx="${radius}" fill="url(#g)"/>
  <g transform="translate(${s / 2} ${s / 2}) scale(${scale}) translate(${-s / 2} ${-s / 2})">
    <text x="256" y="${sub ? 300 : 332}" text-anchor="middle" font-family="Arial Black, Arial, Helvetica, sans-serif" font-weight="900" font-size="${sub ? 250 : 300}" fill="#ffffff">${glyph}</text>
    ${sub ? `<text x="256" y="392" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="58" letter-spacing="10" fill="#ffffff" opacity="0.92">${sub}</text>` : ""}
  </g>
</svg>`
}

mkdirSync("public/pwa", { recursive: true })
for (const app of Object.keys(APPS)) {
  const normal = Buffer.from(svg(app, { maskable: false }))
  const maskable = Buffer.from(svg(app, { maskable: true }))
  await sharp(normal).resize(192, 192).png().toFile(`public/pwa/${app}-192.png`)
  await sharp(normal).resize(512, 512).png().toFile(`public/pwa/${app}-512.png`)
  await sharp(maskable).resize(512, 512).png().toFile(`public/pwa/${app}-maskable-512.png`)
  // iOS : icone d'ecran d'accueil pleine surface (iOS applique lui-meme les coins arrondis)
  await sharp(Buffer.from(svg(app, { maskable: true }))).resize(180, 180).png().toFile(`public/pwa/${app}-180.png`)
  console.log("icones :", app)
}
