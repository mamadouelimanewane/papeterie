import { prisma } from "@/lib/prisma"

/** Taille maximale d'une photo acceptée par le serveur (le navigateur la réduit avant l'envoi). */
export const MAX_IMAGE_BYTES = 2 * 1024 * 1024
export const IMAGE_URL_PREFIX = "/api/images/"

/** Détecte le vrai format d'après les premiers octets (le type MIME envoyé par le client n'est pas fiable). */
export function sniffImage(buf: Buffer): "image/jpeg" | "image/png" | "image/webp" | null {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg"
  if (buf.length >= 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png"
  if (buf.length >= 12 && buf.subarray(0, 4).toString("latin1") === "RIFF" && buf.subarray(8, 12).toString("latin1") === "WEBP") return "image/webp"
  return null
}

export class ImageError extends Error {}

/** Lit le champ `file` d'un envoi multipart et le valide (taille, format réel). */
export async function readUpload(req: Request): Promise<{ data: Buffer; mime: string }> {
  let form: FormData
  try { form = await req.formData() } catch { throw new ImageError("Envoi invalide") }
  const file = form.get("file")
  if (!(file instanceof File) || file.size === 0) throw new ImageError("Aucune image reçue")
  if (file.size > MAX_IMAGE_BYTES) throw new ImageError("Image trop lourde (2 Mo maximum)")
  const data = Buffer.from(await file.arrayBuffer())
  const mime = sniffImage(data)
  if (!mime) throw new ImageError("Format non pris en charge (JPEG, PNG ou WebP)")
  return { data, mime }
}

/** Supprime la photo stockée si l'URL en désigne une (les liens externes et /generic/… ne sont pas touchés). */
export async function deleteStoredImage(url: string | null | undefined) {
  if (!url || !url.startsWith(IMAGE_URL_PREFIX)) return
  const id = url.slice(IMAGE_URL_PREFIX.length)
  if (!id || id.includes("/")) return
  await prisma.productImage.deleteMany({ where: { id } })
}

/** Enregistre une nouvelle photo pour un produit, supprime l'ancienne si elle était stockée ici. */
export async function replaceProductImage(
  product: { id: string; image: string | null; storeId: string },
  upload: { data: Buffer; mime: string },
) {
  const created = await prisma.productImage.create({
    data: { mime: upload.mime, data: new Uint8Array(upload.data), size: upload.data.length, storeId: product.storeId },
    select: { id: true },
  })
  const url = IMAGE_URL_PREFIX + created.id
  try {
    await prisma.product.update({ where: { id: product.id }, data: { image: url } })
  } catch (e) {
    await prisma.productImage.delete({ where: { id: created.id } }).catch(() => {})
    throw e
  }
  await deleteStoredImage(product.image)
  return url
}

/** Retire la photo d'un produit (elle redevient le pictogramme de sa catégorie). */
export async function clearProductImage(product: { id: string; image: string | null }) {
  await prisma.product.update({ where: { id: product.id }, data: { image: null } })
  await deleteStoredImage(product.image)
}
