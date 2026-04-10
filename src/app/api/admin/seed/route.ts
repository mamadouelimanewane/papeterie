import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

const SEED_KEY = process.env.SEED_SECRET ?? "papeterie-seed-2024"

const PRODUCT_IMAGES: Record<string, string> = {
  "Cahier 100 pages grands carreaux": "https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=400",
  "Cahier 200 pages petits carreaux": "https://images.unsplash.com/photo-1517842645767-c639042777db?w=400",
  "Livre Mathematiques 3eme": "https://images.unsplash.com/photo-1509228468518-180dd4864904?w=400",
  "Livre Francais Terminale": "https://images.unsplash.com/photo-1476275466078-4007374efbbe?w=400",
  "Livre Histoire-Geo 5eme": "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400",
  "Regle 30cm Maped": "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=400",
  "Compas metal professionnel": "https://images.unsplash.com/photo-1628348068343-c6a848d2b6dd?w=400",
  "Stylo bille bleu BIC x10": "https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=400",
  "Crayons de couleur 24 pieces": "https://images.unsplash.com/photo-1452860606245-08befc0ff44b?w=400",
  "Cahier de brouillon A4": "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400",
  "Cahier Seyes 96 pages": "https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=400",
  "Livre Physique-Chimie 2nde": "https://images.unsplash.com/photo-1532153975070-2e9ab71f1b14?w=400",
  "Livre SVT 4eme": "https://images.unsplash.com/photo-1519682337058-a94d519337bc?w=400",
  "Equerre 45-60 Maped": "https://images.unsplash.com/photo-1628348068343-c6a848d2b6dd?w=400",
  "Rapporteur 180 transparent": "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=400",
  "Marqueurs fluo x5": "https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=400",
  "Colle en stick UHU 40g": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400",
  "Peinture acrylique 12 couleurs": "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400",
  "Cahier grands carreaux 48 pages": "https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=400",
  "Livre Anglais 6eme": "https://images.unsplash.com/photo-1546521343-4eb2c01aa44b?w=400",
  "Livre Geographie CM2": "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400",
  "Trousse scolaire 10 pieces": "https://images.unsplash.com/photo-1588072432836-e10032774350?w=400",
  "Gomme blanche Staedtler": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400",
  "Taille-crayon double trou": "https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=400",
  "Feutres de coloriage x24": "https://images.unsplash.com/photo-1452860606245-08befc0ff44b?w=400",
  "Carnet de dessin A4 40 pages": "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400",
}

export async function POST(req: Request) {
  try {
    const { key } = await req.json()
    if (key !== SEED_KEY) return NextResponse.json({ error: "Non autorise" }, { status: 401 })

    const results: Record<string, unknown> = {}

    // 1. Categories
    const catNames = ["Livres", "Cahiers", "Art & Creativite", "Geometrie", "Fournitures"]
    for (let i = 0; i < catNames.length; i++) {
      try {
        const existing = await prisma.category.findFirst({ where: { name: catNames[i] } })
        if (!existing) await prisma.category.create({ data: { name: catNames[i], segment: "Papeterie", status: "Active", sequence: i + 1 } })
      } catch {}
    }
    results.categories = await prisma.category.count()

    // 2. Utilisateur demo
    const hashedUser = await bcrypt.hash("Demo2024!", 10)
    let demoUser = await prisma.user.findFirst({ where: { email: "demo@papeterie.sn" } })
    if (!demoUser) {
      try {
        demoUser = await prisma.user.create({ data: { name: "Mamadou Diallo", email: "demo@papeterie.sn", phone: "771234567", password: hashedUser, walletMoney: 15000, userType: "Retail", status: "Active" } })
      } catch {
        await prisma.$executeRawUnsafe("SELECT setval(pg_get_serial_sequence('\"User\"', 'userId'), COALESCE(MAX(\"userId\"), 0) + 1, false) FROM \"User\"")
        try {
          demoUser = await prisma.user.create({ data: { name: "Mamadou Diallo", email: "demo@papeterie.sn", phone: "771234567", password: hashedUser, walletMoney: 15000, userType: "Retail", status: "Active" } })
        } catch {
          demoUser = await prisma.user.findFirst()
        }
      }
    } else {
      await prisma.user.update({ where: { id: demoUser.id }, data: { walletMoney: 15000 } })
    }
    results.demoUser = demoUser?.email ?? "not created"

    // 3. Driver demo
    const hashedDriver = await bcrypt.hash("Demo2024!", 10)
    try {
      const existingDriver = await prisma.driver.findFirst({ where: { email: "livreur@papeterie.sn" } })
      if (!existingDriver) {
        try {
          await prisma.driver.create({ data: { name: "Ibrahima Sarr", email: "livreur@papeterie.sn", phone: "779876543", password: hashedDriver, vehicleType: "Moto", serviceArea: "Dakar", approvalStatus: "Approved", status: "Online", rating: 4.8 } })
        } catch {
          await prisma.$executeRawUnsafe("SELECT setval(pg_get_serial_sequence('\"Driver\"', 'driverId'), COALESCE(MAX(\"driverId\"), 0) + 1, false) FROM \"Driver\"")
          await prisma.driver.create({ data: { name: "Ibrahima Sarr", email: "livreur@papeterie.sn", phone: "779876543", password: hashedDriver, vehicleType: "Moto", serviceArea: "Dakar", approvalStatus: "Approved", status: "Online", rating: 4.8 } })
        }
      }
    } catch {}
    results.driver = (await prisma.driver.findFirst({ where: { email: "livreur@papeterie.sn" } })) ? "OK" : "skipped"

    // 4. Boutiques
    let store1 = await prisma.store.findUnique({ where: { email: "almadies@papeterie.sn" } })
    if (!store1) store1 = await prisma.store.create({ data: { name: "Librairie Papeterie - Almadies", email: "almadies@papeterie.sn", phone: "338204567", address: "Ngor Almadies, Dakar", rating: 4.8, segment: "PAPETERIE", serviceArea: "Dakar", status: "Active" } })
    let store2 = await prisma.store.findUnique({ where: { email: "plateau@papeterie.sn" } })
    if (!store2) store2 = await prisma.store.create({ data: { name: "Papeterie du Plateau", email: "plateau@papeterie.sn", phone: "338201234", address: "Plateau, Dakar", rating: 4.6, segment: "PAPETERIE", serviceArea: "Dakar", status: "Active" } })
    let store3 = await prisma.store.findUnique({ where: { email: "sandaga@papeterie.sn" } })
    if (!store3) store3 = await prisma.store.create({ data: { name: "Librairie Sandaga", email: "sandaga@papeterie.sn", phone: "338209876", address: "Marche Sandaga, Dakar", rating: 4.5, segment: "PAPETERIE", serviceArea: "Dakar", status: "Active" } })
    results.stores = await prisma.store.count()

    // 5. Produits avec images
    const p1 = [
      { name: "Cahier 100 pages grands carreaux", price: 500, category: "Cahiers", stock: 50 },
      { name: "Cahier 200 pages petits carreaux", price: 800, category: "Cahiers", stock: 30 },
      { name: "Livre Mathematiques 3eme", price: 4500, category: "Livres", stock: 20 },
      { name: "Livre Francais Terminale", price: 5000, category: "Livres", stock: 15 },
      { name: "Livre Histoire-Geo 5eme", price: 3800, category: "Livres", stock: 25 },
      { name: "Regle 30cm Maped", price: 350, category: "Geometrie", stock: 100 },
      { name: "Compas metal professionnel", price: 1200, category: "Geometrie", stock: 40 },
      { name: "Stylo bille bleu BIC x10", price: 600, category: "Fournitures", stock: 80 },
      { name: "Crayons de couleur 24 pieces", price: 1500, category: "Art & Creativite", stock: 35 },
    ]
    const p2 = [
      { name: "Cahier de brouillon A4", price: 300, category: "Cahiers", stock: 60 },
      { name: "Cahier Seyes 96 pages", price: 450, category: "Cahiers", stock: 45 },
      { name: "Livre Physique-Chimie 2nde", price: 4200, category: "Livres", stock: 18 },
      { name: "Livre SVT 4eme", price: 3500, category: "Livres", stock: 22 },
      { name: "Equerre 45-60 Maped", price: 400, category: "Geometrie", stock: 70 },
      { name: "Rapporteur 180 transparent", price: 250, category: "Geometrie", stock: 90 },
      { name: "Marqueurs fluo x5", price: 900, category: "Fournitures", stock: 55 },
      { name: "Colle en stick UHU 40g", price: 500, category: "Fournitures", stock: 65 },
      { name: "Peinture acrylique 12 couleurs", price: 3500, category: "Art & Creativite", stock: 20 },
    ]
    const p3 = [
      { name: "Cahier grands carreaux 48 pages", price: 250, category: "Cahiers", stock: 100 },
      { name: "Livre Anglais 6eme", price: 2800, category: "Livres", stock: 30 },
      { name: "Livre Geographie CM2", price: 2500, category: "Livres", stock: 25 },
      { name: "Trousse scolaire 10 pieces", price: 2500, category: "Fournitures", stock: 40 },
      { name: "Gomme blanche Staedtler", price: 150, category: "Fournitures", stock: 200 },
      { name: "Taille-crayon double trou", price: 200, category: "Fournitures", stock: 150 },
      { name: "Feutres de coloriage x24", price: 1800, category: "Art & Creativite", stock: 30 },
      { name: "Carnet de dessin A4 40 pages", price: 1200, category: "Art & Creativite", stock: 25 },
    ]

    // Mettre a jour les images des produits existants
    for (const [name, image] of Object.entries(PRODUCT_IMAGES)) {
      await prisma.product.updateMany({ where: { name }, data: { image } })
    }

    const p1count = await prisma.product.count({ where: { storeId: store1.id } })
    if (p1count === 0) await prisma.product.createMany({ data: p1.map(p => ({ ...p, image: PRODUCT_IMAGES[p.name] ?? null, storeId: store1.id, status: "Active" })) })
    const p2count = await prisma.product.count({ where: { storeId: store2.id } })
    if (p2count === 0) await prisma.product.createMany({ data: p2.map(p => ({ ...p, image: PRODUCT_IMAGES[p.name] ?? null, storeId: store2.id, status: "Active" })) })
    const p3count = await prisma.product.count({ where: { storeId: store3.id } })
    if (p3count === 0) await prisma.product.createMany({ data: p3.map(p => ({ ...p, image: PRODUCT_IMAGES[p.name] ?? null, storeId: store3.id, status: "Active" })) })
    results.products = await prisma.product.count()

    // 6. Commande Pending pour la demo livreur
    if (demoUser) {
      const pendingCount = await prisma.order.count({ where: { userId: demoUser.id, status: "Pending" } })
      if (pendingCount === 0) {
        const deliveredCount = await prisma.order.count({ where: { userId: demoUser.id, status: "Delivered" } })
        if (deliveredCount === 0) {
          await prisma.order.create({ data: { orderId: "ORD-DEMO-001", invoiceId: "INV-DEMO-001", storeId: store1.id, userId: demoUser.id, total: 6300, subtotal: 5800, deliveryFee: 500, status: "Delivered", paymentMethod: "Cash", paymentStatus: "Paye", earning: 630, items: [{ name: "Cahier 100 pages", price: 500, quantity: 2 }, { name: "Stylo BIC x10", price: 600, quantity: 2 }], address: "Almadies, Villa 45, Dakar", createdAt: new Date(Date.now() - 3 * 24 * 3600 * 1000) } })
        }
        await prisma.order.create({ data: { orderId: "ORD-PENDING-" + Date.now(), invoiceId: "INV-PENDING-" + Date.now(), storeId: store2.id, userId: demoUser.id, total: 5200, subtotal: 4700, deliveryFee: 500, status: "Pending", paymentMethod: "Wave", paymentStatus: "En attente", earning: 520, items: [{ name: "Livre Physique-Chimie 2nde", price: 4200, quantity: 1 }, { name: "Equerre Maped", price: 400, quantity: 1 }], address: "Plateau, Immeuble Fahd, Dakar" } })
      }
    }
    results.orders = demoUser ? await prisma.order.count({ where: { userId: demoUser.id } }) : 0

    // 7. Banners
    const bannerCount = await prisma.sliderBanner.count()
    if (bannerCount === 0) {
      await prisma.sliderBanner.createMany({ data: [
        { title: "Livres Scolaires Mon Ecole", image: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800", sequence: 1, status: "Active" },
        { title: "Rentree Papeterie 2024", image: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800", sequence: 2, status: "Active" },
      ]})
    }
    results.banners = await prisma.sliderBanner.count()

    // 8. Notifications
    const notifCount = await prisma.notification.count()
    if (notifCount === 0) {
      await prisma.notification.createMany({ data: [
        { title: "Bienvenue sur Papeterie !", message: "Decouvrez nos boutiques.", target: "All", status: "Sent", sentAt: new Date() },
        { title: "Commande livree !", message: "Votre commande a ete livree.", target: "All", status: "Sent", sentAt: new Date(Date.now() - 3 * 24 * 3600 * 1000) },
      ]})
    }
    results.notifications = await prisma.notification.count()

    return NextResponse.json({ success: true, message: "Seed OK", results })
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erreur"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
