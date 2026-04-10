import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

const SEED_KEY = process.env.SEED_SECRET ?? "papeterie-seed-2024"

export async function POST(req: Request) {
  try {
    const { key } = await req.json()
    if (key !== SEED_KEY) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    // ── 1. Catégories ──────────────────────────────────────────────
    const cats = ["Livres", "Cahiers", "Art & Créativité", "Géométrie", "Fournitures"]
    for (const name of cats) {
      await prisma.category.upsert({
        where: { id: name.toLowerCase().replace(/[^a-z]/g, "-") },
        update: {},
        create: { id: name.toLowerCase().replace(/[^a-z]/g, "-"), name, segment: "Papeterie", status: "Active", sequence: cats.indexOf(name) + 1 },
      })
    }

    // ── 2. Utilisateur démo ────────────────────────────────────────
    const hashedUser = await bcrypt.hash("Demo2024!", 10)
    const demoUser = await prisma.user.upsert({
      where: { email: "demo@papeterie.sn" },
      update: { walletMoney: 15000 },
      create: {
        name: "Mamadou Diallo",
        email: "demo@papeterie.sn",
        phone: "771234567",
        password: hashedUser,
        walletMoney: 15000,
        userType: "Retail",
        status: "Active",
      },
    })

    // ── 3. Driver démo ─────────────────────────────────────────────
    const hashedDriver = await bcrypt.hash("Demo2024!", 10)
    await prisma.driver.upsert({
      where: { email: "livreur@papeterie.sn" },
      update: {},
      create: {
        name: "Ibrahima Sarr",
        email: "livreur@papeterie.sn",
        phone: "779876543",
        password: hashedDriver,
        vehicleType: "Moto",
        serviceArea: "Dakar",
        approvalStatus: "Approved",
        status: "Online",
        rating: 4.8,
      },
    })

    // ── 4. Boutiques ───────────────────────────────────────────────
    const store1 = await prisma.store.upsert({
      where: { email: "almadies@papeterie.sn" },
      update: {},
      create: {
        name: "Librairie Papeterie - Almadies",
        email: "almadies@papeterie.sn",
        phone: "338204567",
        address: "Ngor Almadies, Dakar",
        rating: 4.8,
        segment: "PAPETERIE",
        serviceArea: "Dakar",
        status: "Active",
      },
    })

    const store2 = await prisma.store.upsert({
      where: { email: "plateau@papeterie.sn" },
      update: {},
      create: {
        name: "Papeterie du Plateau",
        email: "plateau@papeterie.sn",
        phone: "338201234",
        address: "Plateau, Dakar",
        rating: 4.6,
        segment: "PAPETERIE",
        serviceArea: "Dakar",
        status: "Active",
      },
    })

    const store3 = await prisma.store.upsert({
      where: { email: "sandaga@papeterie.sn" },
      update: {},
      create: {
        name: "Librairie Sandaga",
        email: "sandaga@papeterie.sn",
        phone: "338209876",
        address: "Marché Sandaga, Dakar",
        rating: 4.5,
        segment: "PAPETERIE",
        serviceArea: "Dakar",
        status: "Active",
      },
    })

    // ── 5. Produits ────────────────────────────────────────────────
    const products1 = [
      { name: "Cahier 100 pages grands carreaux", price: 500, category: "Cahiers", stock: 50 },
      { name: "Cahier 200 pages petits carreaux", price: 800, category: "Cahiers", stock: 30 },
      { name: "Livre Mathématiques 3ème", price: 4500, category: "Livres", stock: 20 },
      { name: "Livre Français Terminale", price: 5000, category: "Livres", stock: 15 },
      { name: "Livre Histoire-Géo 5ème", price: 3800, category: "Livres", stock: 25 },
      { name: "Règle 30cm Maped", price: 350, category: "Géométrie", stock: 100 },
      { name: "Compas métal professionnel", price: 1200, category: "Géométrie", stock: 40 },
      { name: "Stylo bille bleu BIC x10", price: 600, category: "Fournitures", stock: 80 },
      { name: "Crayons de couleur 24 pièces", price: 1500, category: "Art & Créativité", stock: 35 },
    ]

    const products2 = [
      { name: "Cahier de brouillon A4", price: 300, category: "Cahiers", stock: 60 },
      { name: "Cahier Seyes 96 pages", price: 450, category: "Cahiers", stock: 45 },
      { name: "Livre Physique-Chimie 2nde", price: 4200, category: "Livres", stock: 18 },
      { name: "Livre SVT 4ème", price: 3500, category: "Livres", stock: 22 },
      { name: "Equerre 45°/60° Maped", price: 400, category: "Géométrie", stock: 70 },
      { name: "Rapporteur 180° transparent", price: 250, category: "Géométrie", stock: 90 },
      { name: "Marqueurs fluo x5", price: 900, category: "Fournitures", stock: 55 },
      { name: "Colle en stick UHU 40g", price: 500, category: "Fournitures", stock: 65 },
      { name: "Peinture acrylique 12 couleurs", price: 3500, category: "Art & Créativité", stock: 20 },
    ]

    const products3 = [
      { name: "Cahier grands carreaux 48 pages", price: 250, category: "Cahiers", stock: 100 },
      { name: "Livre Anglais 6ème", price: 2800, category: "Livres", stock: 30 },
      { name: "Livre Géographie CM2", price: 2500, category: "Livres", stock: 25 },
      { name: "Trousse scolaire complète 10 pièces", price: 2500, category: "Fournitures", stock: 40 },
      { name: "Gomme blanche Staedtler", price: 150, category: "Fournitures", stock: 200 },
      { name: "Taille-crayon double trou", price: 200, category: "Fournitures", stock: 150 },
      { name: "Feutres de coloriage x24", price: 1800, category: "Art & Créativité", stock: 30 },
      { name: "Carnet de dessin A4 40 pages", price: 1200, category: "Art & Créativité", stock: 25 },
    ]

    for (const p of products1) {
      await prisma.product.create({ data: { ...p, storeId: store1.id, status: "Active" } })
    }
    for (const p of products2) {
      await prisma.product.create({ data: { ...p, storeId: store2.id, status: "Active" } })
    }
    for (const p of products3) {
      await prisma.product.create({ data: { ...p, storeId: store3.id, status: "Active" } })
    }

    // ── 6. Commandes démo ──────────────────────────────────────────
    await prisma.order.create({
      data: {
        orderId: "ORD-DEMO-001",
        invoiceId: "INV-DEMO-001",
        storeId: store1.id,
        userId: demoUser.id,
        total: 6300,
        subtotal: 5800,
        deliveryFee: 500,
        status: "Delivered",
        paymentMethod: "Cash",
        paymentStatus: "Payé",
        earning: 630,
        items: [
          { productId: "p1", name: "Cahier 100 pages grands carreaux", price: 500, quantity: 2 },
          { productId: "p2", name: "Stylo bille bleu BIC x10", price: 600, quantity: 2 },
          { productId: "p3", name: "Règle 30cm Maped", price: 350, quantity: 1 },
        ],
        address: "Almadies, Villa 45, Dakar",
        createdAt: new Date(Date.now() - 3 * 24 * 3600 * 1000),
      },
    })

    await prisma.order.create({
      data: {
        orderId: "ORD-DEMO-002",
        invoiceId: "INV-DEMO-002",
        storeId: store2.id,
        userId: demoUser.id,
        total: 5200,
        subtotal: 4700,
        deliveryFee: 500,
        status: "Pending",
        paymentMethod: "Wallet",
        paymentStatus: "En attente",
        earning: 520,
        items: [
          { productId: "p4", name: "Livre Physique-Chimie 2nde", price: 4200, quantity: 1 },
          { productId: "p5", name: "Equerre 45°/60° Maped", price: 400, quantity: 1 },
        ],
        address: "Plateau, Immeuble Fahd, Dakar",
        createdAt: new Date(Date.now() - 1 * 3600 * 1000),
      },
    })

    // ── 7. Banners ────────────────────────────────────────────────
    await prisma.sliderBanner.createMany({
      data: [
        { title: "Livres Scolaires Mon École", image: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800", link: null, sequence: 1, status: "Active" },
        { title: "Rentrée Papeterie 2024", image: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800", link: null, sequence: 2, status: "Active" },
      ],
      skipDuplicates: true,
    })

    // ── 8. Notifications ──────────────────────────────────────────
    await prisma.notification.createMany({
      data: [
        { title: "Bienvenue sur Papeterie !", message: "Découvrez nos boutiques et commandez vos fournitures scolaires.", target: "All", status: "Sent", sentAt: new Date() },
        { title: "Commande livrée !", message: "Votre commande ORD-DEMO-001 a été livrée avec succès.", target: "All", status: "Sent", sentAt: new Date(Date.now() - 3 * 24 * 3600 * 1000) },
        { title: "Promo Rentrée -10%", message: "Profitez de 10% de réduction sur tous les cahiers ce weekend !", target: "All", status: "Sent", sentAt: new Date(Date.now() - 7 * 24 * 3600 * 1000) },
      ],
      skipDuplicates: true,
    })

    return NextResponse.json({
      success: true,
      message: "Base de données seedée avec succès",
      summary: {
        categories: cats.length,
        users: 1,
        drivers: 1,
        stores: 3,
        products: products1.length + products2.length + products3.length,
        orders: 2,
        banners: 2,
        notifications: 3,
      }
    })
  } catch (error) {
    console.error("[seed]", error)
    const msg = error instanceof Error ? error.message : "Erreur"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
