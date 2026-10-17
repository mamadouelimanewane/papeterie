import type { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { clientIp } from "@/lib/ratelimit"

type Actor = { id?: unknown; sub?: unknown; email?: unknown } | null | undefined

/**
 * Trace une action sensible dans le journal d'audit. Ne lève jamais d'erreur :
 * l'audit ne doit pas bloquer l'action elle-même (l'échec est seulement signalé dans les journaux serveur).
 */
export async function audit(
  req: { headers: Headers } | null,
  actor: Actor,
  action: string,
  target?: string | null,
  details?: Record<string, unknown> | null,
  outcome: "ok" | "refusé" | "échec" = "ok",
) {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: actor ? String(actor.id ?? actor.sub ?? "") || null : null,
        actorEmail: actor?.email ? String(actor.email) : null,
        action, target: target ? String(target).slice(0, 200) : null,
        details: details ? (JSON.parse(JSON.stringify(details)) as Prisma.InputJsonValue) : undefined,
        ip: req ? clientIp(req) : null,
        outcome,
      },
    })
  } catch (e) {
    console.error("[audit]", action, e)
  }
}

export { AUDIT_LABELS } from "./auditLabels"
