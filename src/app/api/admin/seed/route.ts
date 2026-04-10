import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

const SEED_KEY = process.env.SEED_SECRET ?? "papeterie-seed-2024"

export async function POST(req: Request) {
  try {
    const { key } = await req.json()
    if (key !== SEED_KEY) {
      return NextResponse.json({ error: "Non autorise" }, { status: 401 })
    }

    // 1. Categories
    const catNames = ["Livres", "Cahiers", "Art & Creativite", "Geometrie", "Fournitures"]
    for (let i = 0; i < catNames.length; i++) {
      const existing = await prisma.category.findFirst({ where: { name: catNames[i] } })
      if (!existing) {
        await prisma.category.create({ data: { name: catNames[i], segment: "Papeterie", status: "Active", sequence: i + 1 } })
      }
    }

    // 2. Utilisateur demo
    const hashedUser = await bcrypt.hash("Demo2024!", 10)
    let demoUser = await prisma.user.findUnique({ where: { email: "demo@papeterie.sn" } })
    if (!demoUser) {
      demoUser = await prisma.user.create({
        data: { name: "Mamadou Diallo", email: "demo@papeterie.sn", phone: "771234567", password: hashedUser, walletMoney: 15000, userType: "Retail", status: "Active" },
      })
    } else {
      await prisma.user.update({ where: { email: "demo@papeterie.sn" }, data: { walletMoney: 15000 } })
    }

    // 3. Driver demo
    const hashedDriver = await bcrypt.hash("Demo2024!", 10)
    const existingDriver = await prisma.driver.findUnique({ where: { email: "livreur@papeterie.sn" } })
    if (!existingDriver) {
      await prisma.driver.create({
        data: { name: "Ibrahima Sarr", email: "livreur@papeterie.sn", phone: "779876543", password: hashedDriver, vehicleType: "Moto", serviceArea: "Dakar", approvalStatus: "Approved", status: "Online", rating: 4.8 },
      })
    }

    // 4. Boutiques
    let store1 = await prisma.store.findUnique({ where: { email: "almadies@papeterie.sn" } })
    if (!store1) store1 = await prisma.store.create({ data: { name: "Librairie Papeterie - Almadies", email: "almadies@papeterie.sn", phone: "338204567", address: "Ngor Almadies, Dakar", rating: 4.8, segment: "PAPETERIE", serviceArea: "Dakar", status: "Active" } })

    let store2 = await prisma.store.findUnique({ where: { email: "plateau@papeterie.sn" } })
    if (!store2) store2 = await prisma.store.create({ data: { name: "Papeterie du Plateau", email: "plateau@papeterie.sn", phone: "338201234", address: "Plateau, Dakar", rating: 4.6, segment: "PAPETERIE", serviceArea: "Dakar", status: "Active" } })

    let store3 = await prisma.store.findUnique({ where: { email: "sandaga@papeterie.sn" } })
    if (!store3) store3 = await prisma.store.create({ data: { name: "Librairie Sandaga", email: "sandaga@papeterie.sn", phone: "338209876", address: "Marche Sandaga, Dakar", rating: 4.5, segment: "PAPETERIE", serviceArea: "Dakar", status: "Active" } })

    // 5. Produits (inserer seulement si boutique vide)
    const p1count = await prisma.product.count({ where: { storeId: store1.id } })
    if (p1count === 0) {
      await prisma.product.createMany({ data: [
        { name: "Cahier 100 pages grands carreaux", price: 500, category: "Cahiers", stock: 50, storeId: store1.id, status: "Active" },
        { name: "Cahier 200 pages petits carreaux", price: 800, category: "Cahiers", stock: 30, storeId: store1.id, status: "Active" },
        { name: "Livre Mathematiques 3eme", price: 4500, category: "Livres", stock: 20, storeId: store1.id, status: "Active" },
        { name: "Livre Francais Terminale", price: 5000, category: "Livres", stock: 15, storeId: store1.id, status: "Active" },
        { name: "Livre Histoire-Geo 5eme", price: 3800, category: "Livres", stock: 25, storeId: store1.id, status: "Active" },
        { name: "Regle 30cm Maped", price: 350, category: "Geometrie", stock: 100, storeId: store1.id, status: "Active" },
        { name: "Compas metal professionnel", price: 1200, category: "Geometrie", stock: 40, storeId: store1.id, status: "Active" },
        { name: "Stylo bille bleu BIC x10", price: 600, category: "Fournitures", stock: 80, storeId: store1.id, status: "Active" },
        { name: "Crayons de couleur 24 pieces", price: 1500, category: "Art & Creativite", stock: 35, storeId: store1.id, status: "Active" },
      ]})
    }

    const p2count = await prisma.product.count({ where: { storeId: store2.id } })
    if (p2count === 0) {
      await prisma.product.createMany({ data: [
        { name: "Cahier de brouillon A4", price: 300, category: "Cahiers", stock: 60, storeId: store2.id, status: "Active" },
        { name: "Cahier Seyes 96 pages", price: 450, category: "Cahiers", stock: 45, storeId: store2.id, status: "Active" },
        { name: "Livre Physique-Chimie 2nde", price: 4200, category: "Livres", stock: 18, storeId: store2.id, status: "Active" },
        { name: "Livre SVT 4eme", price: 3500, category: "Livres", stock: 22, storeId: store2.id, status: "Active" },
        { name: "Equerre 45/60 Maped", price: 400, category: "Geometrie", stock: 70, storeId: store2.id, status: "Active" },
        { name: "Rapporteur 180 transparent", price: 250, category: "Geometrie", stock: 90, storeId: store2.id, status: "Active" },
        { name: "Marqueurs fluo x5", price: 900, category: "Fournitures", stock: 55, storeId: store2.id, status: "Active" },
        { name: "Colle en stick UHU 40g", price: 500, category: "Fournitures", stock: 65, storeId: store2.id, status: "Active" },
        { name: "Peinture acrylique 12 couleurs", price: 3500, category: "Art & Creativite", stock: 20, storeId: store2.id, status: "Active" },
      ]})
    }

    const p3count = await prisma.product.count({ where: { storeId: store3.id } })
    if (p3count === 0) {
      await prisma.product.createMany({ data: [
        { name: "Cahier grands carreaux 48 pages", price: 250, category: "Cahiers", stock: 100, storeId: store3.id, status: "Active" },
        { name: "Livre Anglais 6eme", price: 2800, category: "Livres", stock: 30, storeId: store3.id, status: "Active" },
        { name: "Livre Geographie CM2", price: 2500, category: "Livres", stock: 25, storeId: store3.id, status: "Active" },
        { name: "Trousse scolaire complete 10 pieces", price: 2500, category: "Fournitures", stock: 40, storeId: store3.id, status: "Active" },
        { name: "Gomme blanche Staedtler", price: 150, category: "Fournitures", stock: 200, storeId: store3.id, status: "Active" },
        { name: "Taille-crayon double trou", price: 200, category: "Fournitures", stock: 150, storeId: store3.id, status: "Active" },
        { name: "Feutres de coloriage x24", price: 1800, category: "Art & Creativite", stock: 30, storeId: store3.id, status: "Active" },
        { name: "Carnet de dessin A4 40 pages", price: 1200, category: "Art & Creativite", stock: 25, storeId: store3.id, status: "Active" },
      ]})
    }

    // 6. Commandes demo
    const existingOrders = await prisma.order.count({ where: { userId: demoUser.id } })
    if (existingOrders === 0) {
      await prisma.order.create({ data: { orderId: "ORD-DEMO-001", invoiceId: "INV-DEMO-001", storeId: store1.id, userId: demoUser.id, total: 6300, subtotal: 5800, deliveryFee: 500, status: "Delivered", paymentMethod: "Cash", paymentStatus: "Paye", earning: 630, items: [{ name: "Cahier 100 pages grands carreaux", price: 500, quantity: 2 }, { name: "Stylo bille bleu BIC x10", price: 600, quantity: 2 }, { name: "Regle 30cm Maped", price: 350, quantity: 1 }], address: "Almadies, Villa 45, Dakar", createdAt: new Date(Date.now() - 3 * 24 * 3600 * 1000) } })
      await prisma.order.create({ data: { orderId: "ORD-DEMO-002", invoiceId: "INV-DEMO-002", storeId: store2.id, userId: demoUser.id, total: 5200, subtotal: 4700, deliveryFee: 500, status: "Pending", paymentMethod: "Wallet", paymentStatus: "En attente", earning: 520, items: [{ name: "Livre Physique-Chimie 2nde", price: 4200, quantity: 1 }, { name: "Equerre 45/60 Maped", price: 400, quantity: 1 }], address: "Plateau, Immeuble Fahd, Dakar", createdAt: new Date(Date.now() - 1 * 3600 * 1000) } })
    }

    // 7. Banners
    const bannerCount = await prisma.sliderBanner.count()
    if (bannerCount === 0) {
      await prisma.sliderBanner.createMany({ data: [
        { title: "Livres Scolaires Mon Ecole", image: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800", sequence: 1, status: "Active" },
        { title: "Rentree Papeterie 2024", image: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800", sequence: 2, status: "Active" },
      ]})
    }

    // 8. Notifications
    const notifCount = await prisma.notification.count()
    if (notifCount === 0) {
      await prisma.notification.createMany({ data: [
        { title: "Bienvenue sur Papeterie !", message: "Decouvrez nos boutiques et commandez vos fournitures scolaires.", target: "All", status: "Sent", sentAt: new Date() },
        { title: "Commande livree !", message: "Votre commande ORD-DEMO-001 a ete livree avec succes.", target: "All", status: "Sent", sentAt: new Date(Date.now() - 3 * 24 * 3600 * 1000) },
        { title: "Promo Rentree -10%", message: "Profitez de 10% de reduction sur tous les cahiers ce weekend !", target: "All", status: "Sent", sentAt: new Date(Date.now() - 7 * 24 * 3600 * 1000) },
      ]})
    }

    const summary = {
      stores: await prisma.store.count(),
      products: await prisma.product.count(),
      orders: await prisma.order.count({ where: { userId: demoUser.id } }),
      categories: await prisma.category.count(),
      banners: await prisma.sliderBanner.count(),
      demoUser: demoUser.email,
    }

    return NextResponse.json({ success: true, message: "Seed OK", summary })
  } catch (error) {
    console.error("[seed]", error)
    const msg = error instanceof Error ? error.message : "Erreur"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
