"use client"

import { useEffect, useState } from "react"
import { X, Upload } from "lucide-react"
import { useFeedback } from "./Feedback"

export type FieldOption = string | { value: string; label: string }
export type Field = {
  key: string
  label: string
  type?: "text" | "number" | "textarea" | "select" | "date" | "datetime" | "time" | "email" | "url" | "tel" | "password" | "color" | "checkbox" | "days" | "image"
  options?: FieldOption[]
  required?: boolean
  placeholder?: string
  full?: boolean // occupe toute la largeur
  help?: string
  step?: string
  min?: number
}

export const DAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"]
const optValue = (o: FieldOption) => (typeof o === "string" ? o : o.value)
const optLabel = (o: FieldOption) => (typeof o === "string" ? o : o.label)
export const STATUS_OPTIONS: FieldOption[] = [{ value: "Active", label: "Actif" }, { value: "Inactive", label: "Inactif" }]

const input = "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-300"

/** Champ de formulaire unique (réutilisé par FormModal et les pages de configuration). */
export function FieldInput({ field: f, value, onChange }: { field: Field; value: unknown; onChange: (v: unknown) => void }) {
  const { toast } = useFeedback()
  const v = value ?? ""
  switch (f.type) {
    case "textarea":
      return <textarea rows={4} className={input} value={String(v)} placeholder={f.placeholder} onChange={(e) => onChange(e.target.value)} required={f.required} />
    case "select":
      return (
        <select className={input} value={String(v)} onChange={(e) => onChange(e.target.value)} required={f.required}>
          {!f.required && <option value="">—</option>}
          {f.options?.map((o) => <option key={optValue(o)} value={optValue(o)}>{optLabel(o)}</option>)}
        </select>
      )
    case "checkbox":
      return (
        <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" className="h-4 w-4 accent-indigo-600" checked={Boolean(value)} onChange={(e) => onChange(e.target.checked)} />
          {f.placeholder ?? "Activé"}
        </label>
      )
    case "days": {
      const sel: number[] = Array.isArray(value) ? (value as number[]) : []
      return (
        <div className="flex flex-wrap gap-1.5">
          {DAYS.map((d, i) => {
            const on = sel.includes(i)
            return (
              <button type="button" key={d} onClick={() => onChange(on ? sel.filter((x) => x !== i) : [...sel, i].sort())}
                className={`rounded-md px-2.5 py-1 text-xs font-semibold ${on ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>{d}</button>
            )
          })}
        </div>
      )
    }
    case "image":
      return (
        <div className="space-y-2">
          <div className="flex gap-2">
            <input className={input} value={String(v)} placeholder={f.placeholder ?? "https://… ou fichier"} onChange={(e) => onChange(e.target.value)} required={f.required} />
            <label className="flex shrink-0 cursor-pointer items-center gap-1 rounded-lg border border-gray-200 px-3 text-xs text-gray-600 hover:bg-gray-50">
              <Upload size={14} /> Fichier
              <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                const file = e.target.files?.[0]
                if (!file) return
                if (file.size > 400_000) { toast("Image trop lourde (400 Ko max). Utilisez plutôt une URL.", "error"); return }
                const r = new FileReader()
                r.onload = () => onChange(String(r.result))
                r.readAsDataURL(file)
              }} />
            </label>
          </div>
          {typeof value === "string" && value && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="h-20 w-auto rounded border border-gray-100 object-contain" />
          )}
        </div>
      )
    default: {
      const type = f.type === "datetime" ? "datetime-local" : f.type ?? "text"
      let shown = String(v)
      if (f.type === "date" && shown) shown = shown.slice(0, 10)
      if (f.type === "datetime" && shown) shown = shown.slice(0, 16)
      return <input type={type} className={input} value={shown} placeholder={f.placeholder} step={f.step} min={f.min}
        onChange={(e) => onChange(e.target.value)} required={f.required} />
    }
  }
}

type Props = {
  open: boolean
  title: string
  fields: Field[]
  initial?: Record<string, unknown>
  submitLabel?: string
  onClose: () => void
  onSubmit: (values: Record<string, unknown>) => Promise<unknown>
  onValuesChange?: (values: Record<string, unknown>, changedKey: string) => void
}

export default function FormModal({ open, title, fields, initial, submitLabel = "Enregistrer", onClose, onSubmit, onValuesChange }: Props) {
  const [values, setValues] = useState<Record<string, unknown>>({})
  const [busy, setBusy] = useState(false)

  // Réinitialise le formulaire à l'ouverture uniquement (pas à chaque rendu du parent).
  useEffect(() => {
    if (open) setValues(initial ?? {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  if (!open) return null

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    try { await onSubmit(values) } finally { setBusy(false) }
  }

  return (
    <div className="fixed inset-0 z-[90] grid place-items-end bg-black/40 sm:place-items-center sm:p-4" onClick={onClose}>
      <form onSubmit={submit} onClick={(e) => e.stopPropagation()}
        className="flex max-h-[92vh] w-full max-w-2xl flex-col rounded-t-2xl bg-white shadow-xl sm:rounded-xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h3 className="font-semibold text-gray-800">{title}</h3>
          <button type="button" onClick={onClose} className="rounded p-1 text-gray-400 hover:bg-gray-100" aria-label="Fermer"><X size={18} /></button>
        </div>
        <div className="grid flex-1 grid-cols-1 gap-4 overflow-y-auto p-5 sm:grid-cols-2">
          {fields.map((f) => (
            <div key={f.key} className={f.full || f.type === "textarea" || f.type === "image" || f.type === "days" ? "sm:col-span-2" : ""}>
              <label className="mb-1 block text-xs font-medium text-gray-500">{f.label}{f.required && <span className="text-red-500"> *</span>}</label>
              <FieldInput field={f} value={values[f.key]} onChange={(v) => { const next = { ...values, [f.key]: v }; setValues(next); onValuesChange?.(next, f.key) }} />
              {f.help && <p className="mt-1 text-[11px] text-gray-400">{f.help}</p>}
            </div>
          ))}
        </div>
        <div className="flex justify-end gap-2 border-t border-gray-100 px-5 py-3">
          <button type="button" onClick={onClose} className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">Annuler</button>
          <button type="submit" disabled={busy} className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60">
            {busy ? "Enregistrement…" : submitLabel}
          </button>
        </div>
      </form>
    </div>
  )
}
