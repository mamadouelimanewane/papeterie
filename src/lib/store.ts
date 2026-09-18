import { prisma } from "@/lib/prisma"

/**
 * Mode mono-boutique : l'application est configuree pour un seul client (une seule boutique).
 * La "boutique active" est definie par la variable d'environnement ACTIVE_STORE_ID.
 * A defaut, on retombe sur la premiere boutique Active (la plus ancienne).
 */
export async function getActiveStoreId(): Promise<string | null> {
  const configured = process.env.ACTIVE_STORE_ID
  if (configured) return configured
  const first = await prisma.store.findFirst({
    where: { status: "Active" },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  })
  return first?.id ?? null
}

export async function getActiveStore() {
  const id = await getActiveStoreId()
  if (!id) return null
  return prisma.store.findUnique({
    where: { id },
    include: { _count: { select: { products: true, orders: true } } },
  })
}
