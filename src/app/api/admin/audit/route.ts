import { NextRequest, NextResponse } from "next/server"
import type { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { requireAdmin, isResponse, errorResponse } from "@/lib/adminAuth"

/** Journal d'audit (permission « Sécurité ») : filtres action, personne, période, recherche ; 50 par page ou CSV. */
export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req, "security.manage")
  if (isResponse(auth)) return auth
  try {
    const q = req.nextUrl.searchParams
    const where: Prisma.AuditLogWhereInput = {}
    if (q.get("action")) where.action = { startsWith: q.get("action")! }
    if (q.get("actor")) where.actorEmail = { contains: q.get("actor")!, mode: "insensitive" }
    if (q.get("outcome")) where.outcome = q.get("outcome")!
    const from = q.get("from"), to = q.get("to")
    if (from || to) where.at = { ...(from ? { gte: new Date(`${from}T00:00:00Z`) } : {}), ...(to ? { lte: new Date(`${to}T23:59:59Z`) } : {}) }
    if (q.get("q")) where.OR = [{ target: { contains: q.get("q")!, mode: "insensitive" } }, { actorEmail: { contains: q.get("q")!, mode: "insensitive" } }, { ip: { contains: q.get("q")! } }]
    if (q.get("format") === "csv") {
      const rows = await prisma.auditLog.findMany({ where, orderBy: { at: "desc" }, take: 20000 })
      const cell = (v: unknown) => { const s = typeof v === "string" ? v : v == null ? "" : JSON.stringify(v); return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s }
      const csv = [["Date", "Action", "Résultat", "Par", "Élément", "Détails", "Adresse IP"], ...rows.map((r) => [r.at.toISOString(), r.action, r.outcome, r.actorEmail, r.target, r.details, r.ip])].map((r) => r.map(cell).join(";")).join("\r\n")
      return new NextResponse("﻿" + csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="journal-audit.csv"` } })
    }
    const page = Math.max(1, Number(q.get("page")) || 1)
    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({ where, orderBy: { at: "desc" }, skip: (page - 1) * 50, take: 50 }),
      prisma.auditLog.count({ where }),
    ])
    return NextResponse.json({ logs, total, page, pages: Math.max(1, Math.ceil(total / 50)) })
  } catch (e) { return errorResponse(e, "Erreur serveur", "[audit GET]") }
}
