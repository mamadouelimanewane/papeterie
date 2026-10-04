"use client"

import { Save } from "lucide-react"
import { FieldInput, type Field } from "./FormModal"
import { useAction } from "./Feedback"
import { useSetting } from "@/hooks/useAdminData"
import { fmtDate } from "@/lib/adminApi"

export type Section = { title: string; fields: Field[]; description?: string }

type Props<T extends Record<string, unknown>> = {
  settingKey: string
  title: string
  icon?: React.ReactNode
  description?: string
  sections: Section[]
  defaults: T
  extraActions?: (value: T) => React.ReactNode
  children?: (value: T) => React.ReactNode // contenu additionnel (aperçu…)
  columns?: 1 | 2
}

/** Formulaire de configuration persistant (table AppSetting) : sections de champs + bouton Enregistrer. */
export default function SettingsPage<T extends Record<string, unknown>>({ settingKey, title, icon = "⚙️", description, sections, defaults, extraActions, children, columns = 2 }: Props<T>) {
  const { value, set, save, loading, saving, updatedAt } = useSetting<T>(settingKey, defaults)
  const run = useAction()

  return (
    <form onSubmit={(e) => { e.preventDefault(); run(() => save(), "Configuration enregistrée") }}>
      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-lg font-semibold text-gray-700"><span>{icon}</span> {title}</h1>
        {description && <p className="mt-0.5 text-xs text-gray-400">{description}</p>}
      </div>
      <div className={`grid grid-cols-1 gap-6 ${columns === 2 ? "md:grid-cols-2" : "max-w-2xl"} ${loading ? "pointer-events-none opacity-60" : ""}`}>
        {sections.map((s) => (
          <div key={s.title} className="space-y-4 rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="border-b border-gray-100 pb-2">
              <h2 className="font-semibold text-gray-700">{s.title}</h2>
              {s.description && <p className="mt-0.5 text-xs text-gray-400">{s.description}</p>}
            </div>
            {s.fields.map((f) => (
              <div key={f.key}>
                {f.type !== "checkbox" && <label className="mb-1 block text-xs text-gray-500">{f.label}{f.required && <span className="text-red-500"> *</span>}</label>}
                <FieldInput field={f.type === "checkbox" ? { ...f, placeholder: f.label } : f} value={value[f.key]} onChange={(v) => set(f.key as keyof T, v as T[keyof T])} />
                {f.help && <p className="mt-1 text-[11px] text-gray-400">{f.help}</p>}
              </div>
            ))}
          </div>
        ))}
      </div>
      {children?.(value)}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button type="submit" disabled={saving || loading}
          className="flex items-center gap-2 rounded-lg bg-green-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-600 disabled:opacity-60">
          <Save size={16} /> {saving ? "Enregistrement…" : "Enregistrer"}
        </button>
        {extraActions?.(value)}
        {updatedAt && <span className="text-xs text-gray-400">Dernière modification : {fmtDate(updatedAt)}</span>}
      </div>
    </form>
  )
}
