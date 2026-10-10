/**
 * Champs d'une boutique visibles sans authentification (vitrine, app client).
 * Jamais : solde (walletMoney), e-mail, commandes, ni aucune donnée de l'espace marchand.
 */
export const PUBLIC_STORE_SELECT = {
  id: true,
  name: true,
  phone: true,
  address: true,
  image: true,
  rating: true,
  status: true,
  serviceArea: true,
  segment: true,
  _count: { select: { products: true } },
} as const

/**
 * Champs de commande renvoyés au back-office dans le détail d'une boutique.
 * Les codes de ramassage / livraison et la signature n'y figurent pas : ils restent
 * réservés au client, au marchand et au livreur concernés.
 */
export const ADMIN_STORE_ORDER_SELECT = {
  id: true,
  orderId: true,
  userId: true,
  driverId: true,
  total: true,
  subtotal: true,
  deliveryFee: true,
  status: true,
  paymentMethod: true,
  paymentStatus: true,
  earning: true,
  items: true,
  address: true,
  invoiceId: true,
  notes: true,
  createdAt: true,
  updatedAt: true,
} as const
