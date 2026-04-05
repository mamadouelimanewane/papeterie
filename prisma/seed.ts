import "dotenv/config"
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import pg from "pg"

const connectionString = process.env.DATABASE_URL || ""
const pool = new pg.Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log("🌱 Seeding Papeterie database...")

  // Clean existing data to avoid conflicts
  await prisma.product.deleteMany()
  await prisma.category.deleteMany()
  await prisma.sliderBanner.deleteMany()
  // Note: We don't delete Users or Stores to avoid breaking existing relations unless necessary
  // But for a clean seed, let's at least ensure we can upsert Stores

  // 1. Categories
  const categories = [
    { name: "Livres", segment: "Papeterie", image: "https://cdn-icons-png.flaticon.com/512/3145/3145765.png" },
    { name: "Cahiers", segment: "Papeterie", image: "https://cdn-icons-png.flaticon.com/512/2991/2991100.png" },
    { name: "Art & Créativité", segment: "Papeterie", image: "https://cdn-icons-png.flaticon.com/512/2970/2970785.png" },
    { name: "Géométrie", segment: "Papeterie", image: "https://cdn-icons-png.flaticon.com/512/2612/2612140.png" },
    { name: "Sacs à dos", segment: "Papeterie", image: "https://cdn-icons-png.flaticon.com/512/2991/2991101.png" },
  ]

  for (const cat of categories) {
    await prisma.category.create({ data: cat })
  }

  // 2. Stores
  const stores = [
    {
      name: "Mon École - Plateau",
      email: "contact@monecole.sn",
      serviceArea: "Dakar Plateau",
      rating: 4.9,
      segment: "PAPETERIE",
      status: "Active",
    },
    {
      name: "Librairie Papeterie - Almadies",
      email: "almadies@papeterie.sn",
      serviceArea: "Ngor Almadies",
      rating: 4.8,
      segment: "PAPETERIE",
      status: "Active",
    },
  ]

  for (const s of stores) {
    const store = await prisma.store.upsert({
      where: { email: s.email },
      update: s,
      create: s,
    })

    // 3. Products
    const products = [
      { name: "Cahier 200 pages quadrillé", price: 1500, category: "Cahiers", stock: 100 },
      { name: "Stylo à bille bleu (lot de 4)", price: 800, category: "Stylos", stock: 200 },
      { name: "Kit de géométrie complet", price: 2500, category: "Géométrie", stock: 50 },
      { name: "Sac à dos d'école standard", price: 8500, category: "Sacs à dos", stock: 30 },
      { name: "Boîte de crayons de couleur (24)", price: 3200, category: "Art & Créativité", stock: 60 },
    ]

    for (const p of products) {
      await prisma.product.create({
        data: {
          ...p,
          storeId: store.id,
          image: "https://cdn-icons-png.flaticon.com/512/2612/2612154.png",
        },
      })
    }
  }

  // 4. Slider Banners
  const banners = [
    { title: "Livres Scolaires Mon École", image: "https://img.freepik.com/free-vector/back-school-banner-template_23-2148602244.jpg", status: "Active" },
    { title: "Prêt pour la rentrée ?", image: "https://img.freepik.com/free-vector/hand-drawn-back-school-background_23-2148616147.jpg", status: "Active" },
  ]

  for (const b of banners) {
    await prisma.sliderBanner.create({ data: b })
  }

  console.log("✅ Seeding completed !")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
