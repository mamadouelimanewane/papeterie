import { NextRequest, NextResponse } from "next/server"
import net from "node:net"
import tls from "node:tls"
import { requireAdmin, isResponse } from "@/lib/adminAuth"

export const runtime = "nodejs"

/**
 * Test de connexion SMTP : ouvre une connexion vers hôte:port et lit la bannière du serveur (code 220).
 * Corps : { host, port, encryption: "TLS" | "SSL" | "None" }
 */
export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req, "settings.manage")
  if (isResponse(auth)) return auth
  const { host, port, encryption } = await req.json().catch(() => ({}))
  const p = Number(port)
  if (!host || typeof host !== "string" || !/^[a-z0-9.-]+$/i.test(host) || !Number.isInteger(p) || p < 1 || p > 65535) {
    return NextResponse.json({ ok: false, error: "Hôte ou port invalide" }, { status: 400 })
  }
  const banner = await new Promise<{ ok: boolean; message: string }>((resolve) => {
    const onData = (d: Buffer) => { const m = d.toString().trim(); sock.destroy(); resolve({ ok: m.startsWith("220"), message: m.slice(0, 160) }) }
    const sock = encryption === "SSL"
      ? tls.connect({ host, port: p, servername: host, timeout: 6000 })
      : net.connect({ host, port: p, timeout: 6000 })
    sock.once("data", onData)
    sock.once("timeout", () => { sock.destroy(); resolve({ ok: false, message: "Délai dépassé : serveur injoignable" }) })
    sock.once("error", (e) => resolve({ ok: false, message: e.message }))
  })
  return NextResponse.json(banner)
}
