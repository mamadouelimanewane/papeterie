"use client"

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react"
import { CheckCircle2, AlertTriangle, Info, X } from "lucide-react"

/* ───────── Notifications (toasts) + confirmation, partagées par tout le back-office ───────── */

type ToastKind = "success" | "error" | "info"
type Toast = { id: number; kind: ToastKind; msg: string }
type ConfirmOpts = { title: string; message?: string; confirmLabel?: string; danger?: boolean }

const Ctx = createContext<{
  toast: (msg: string, kind?: ToastKind) => void
  confirm: (o: ConfirmOpts) => Promise<boolean>
} | null>(null)

export function FeedbackProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const [dialog, setDialog] = useState<ConfirmOpts | null>(null)
  const resolver = useRef<((v: boolean) => void) | null>(null)
  const seq = useRef(0)

  const toast = useCallback((msg: string, kind: ToastKind = "success") => {
    const id = ++seq.current
    setToasts((t) => [...t, { id, kind, msg }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), kind === "success" ? 3500 : 7000)
  }, [])

  const confirm = useCallback((o: ConfirmOpts) => {
    setDialog(o)
    return new Promise<boolean>((res) => { resolver.current = res })
  }, [])

  const value = useMemo(() => ({ toast, confirm }), [toast, confirm])
  const close = (v: boolean) => { resolver.current?.(v); resolver.current = null; setDialog(null) }

  return (
    <Ctx.Provider value={value}>
      {children}
      <div className="fixed right-4 top-16 z-[100] flex w-[min(92vw,360px)] flex-col gap-2">
        {toasts.map((t) => (
          <div key={t.id} role="status"
            className={`flex items-start gap-2 rounded-lg px-4 py-3 text-sm text-white shadow-lg ${t.kind === "error" ? "bg-red-600" : t.kind === "info" ? "bg-slate-800" : "bg-emerald-600"}`}>
            {t.kind === "error" ? <AlertTriangle size={16} className="mt-0.5 shrink-0" /> : t.kind === "info" ? <Info size={16} className="mt-0.5 shrink-0" /> : <CheckCircle2 size={16} className="mt-0.5 shrink-0" />}
            <span className="flex-1">{t.msg}</span>
            <button onClick={() => setToasts((l) => l.filter((x) => x.id !== t.id))} aria-label="Fermer" className="opacity-70 hover:opacity-100"><X size={14} /></button>
          </div>
        ))}
      </div>
      {dialog && (
        <div className="fixed inset-0 z-[110] grid place-items-center bg-black/40 p-4" onClick={() => close(false)}>
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-semibold text-gray-800">{dialog.title}</h3>
            {dialog.message && <p className="mt-2 text-sm text-gray-500">{dialog.message}</p>}
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => close(false)} className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">Annuler</button>
              <button onClick={() => close(true)} autoFocus
                className={`rounded-lg px-4 py-2 text-sm font-semibold text-white ${dialog.danger ? "bg-red-600 hover:bg-red-700" : "bg-indigo-600 hover:bg-indigo-700"}`}>
                {dialog.confirmLabel ?? "Confirmer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </Ctx.Provider>
  )
}

export function useFeedback() {
  const c = useContext(Ctx)
  if (!c) throw new Error("useFeedback doit être utilisé dans <FeedbackProvider>")
  return c
}

/** Exécute une action asynchrone avec toast de succès / d'erreur. */
export function useAction() {
  const { toast } = useFeedback()
  return async <T,>(fn: () => Promise<T>, success?: string): Promise<T | undefined> => {
    try {
      const r = await fn()
      if (success) toast(success)
      return r
    } catch (e) {
      toast(e instanceof Error ? e.message : "Une erreur est survenue", "error")
      return undefined
    }
  }
}
