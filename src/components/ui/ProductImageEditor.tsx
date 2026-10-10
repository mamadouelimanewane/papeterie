"use client"

import { useEffect, useRef, useState } from "react"
import { ImagePlus, Loader2, Trash2, Package } from "lucide-react"

const MAX_SIDE = 900
const MAX_BYTES = 1_800_000 // marge sous la limite serveur (2 Mo)

/** Réduit la photo (900 px max, WebP puis JPEG) pour un envoi léger et un affichage rapide. */
async function compress(file: File): Promise<Blob> {
  if (!file.type.startsWith("image/")) throw new Error("Ce fichier n'est pas une image")
  const bmp = await createImageBitmap(file).catch(() => { throw new Error("Image illisible") })
  const scale = Math.min(1, MAX_SIDE / Math.max(bmp.width, bmp.height))
  const canvas = document.createElement("canvas")
  canvas.width = Math.max(1, Math.round(bmp.width * scale))
  canvas.height = Math.max(1, Math.round(bmp.height * scale))
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("Traitement de l'image impossible")
  ctx.fillStyle = "#ffffff" // PNG transparent -> fond blanc
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(bmp, 0, 0, canvas.width, canvas.height)
  bmp.close()
  const toBlob = (type: string, q: number) => new Promise<Blob | null>((r) => canvas.toBlob(r, type, q))
  let blob = await toBlob("image/webp", 0.85)
  if (!blob || blob.type !== "image/webp") blob = await toBlob("image/jpeg", 0.85)
  if (!blob) throw new Error("Traitement de l'image impossible")
  if (blob.size > MAX_BYTES) blob = (await toBlob("image/jpeg", 0.6)) ?? blob
  if (blob.size > MAX_BYTES) throw new Error("Image trop lourde, choisissez-en une plus petite")
  return blob
}

type Props = {
  /** Image actuelle (URL) du produit. */
  src: string | null
  /**
   * Envoi immédiat : POST (multipart, champ `file`) puis DELETE sur cette URL.
   * Sans `uploadUrl` (nouveau produit non encore créé), la photo est seulement choisie : voir `onPick`.
   */
  uploadUrl?: string
  /** Appelé après un envoi / une suppression réussis, avec la nouvelle URL (ou null). */
  onChanged?: (url: string | null) => void
  /** Mode différé : photo choisie (déjà réduite) ou null si retirée. */
  onPick?: (blob: Blob | null) => void
  disabled?: boolean
}

export default function ProductImageEditor({ src, uploadUrl, onChanged, onPick, disabled }: Props) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [preview, setPreview] = useState<string | null>(null) // aperçu local (mode différé)
  const [drag, setDrag] = useState(false)
  const input = useRef<HTMLInputElement>(null)
  const shown = preview ?? src

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview) }, [preview])

  async function handleFile(file: File | undefined) {
    if (!file) return
    setError("")
    setBusy(true)
    try {
      const blob = await compress(file)
      if (uploadUrl) {
        const form = new FormData()
        form.append("file", blob, "photo." + (blob.type === "image/webp" ? "webp" : "jpg"))
        const res = await fetch(uploadUrl, { method: "POST", body: form })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(data.error || `Erreur ${res.status}`)
        onChanged?.(data.image)
      } else {
        setPreview((old) => { if (old) URL.revokeObjectURL(old); return URL.createObjectURL(blob) })
        onPick?.(blob)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur")
    } finally {
      setBusy(false)
      if (input.current) input.current.value = ""
    }
  }

  async function remove() {
    setError("")
    if (!uploadUrl) { setPreview(null); onPick?.(null); return }
    if (!window.confirm("Supprimer la photo de ce produit ?")) return
    setBusy(true)
    try {
      const res = await fetch(uploadUrl, { method: "DELETE" })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || `Erreur ${res.status}`)
      onChanged?.(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <div className="flex items-center gap-4">
        <div
          onDragOver={(e) => { e.preventDefault(); if (!disabled) setDrag(true) }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => { e.preventDefault(); setDrag(false); if (!disabled && !busy) handleFile(e.dataTransfer.files?.[0]) }}
          className={`relative flex h-28 w-28 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl border-2 border-dashed ${drag ? "border-brand-500 bg-sun-50" : "border-gray-200 bg-gray-50"}`}
        >
          {shown
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={shown} alt="Photo du produit" className="h-full w-full object-cover" />
            : <Package size={28} className="text-gray-300" />}
          {busy && <div className="absolute inset-0 flex items-center justify-center bg-white/70"><Loader2 size={22} className="animate-spin text-brand-600" /></div>}
        </div>
        <div className="space-y-2">
          <input ref={input} type="file" accept="image/jpeg,image/png,image/webp,image/*" className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />
          <button type="button" disabled={disabled || busy} onClick={() => input.current?.click()}
            className="flex items-center gap-2 rounded-xl bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:bg-brand-300">
            <ImagePlus size={15} /> {shown ? "Changer la photo" : "Ajouter une photo"}
          </button>
          {shown && (
            <button type="button" disabled={disabled || busy} onClick={remove}
              className="flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-100 disabled:opacity-50">
              <Trash2 size={15} /> Supprimer la photo
            </button>
          )}
          <p className="text-xs text-gray-400">JPEG, PNG ou WebP. Réduite automatiquement. Vous pouvez aussi glisser une image sur le cadre.</p>
        </div>
      </div>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  )
}
