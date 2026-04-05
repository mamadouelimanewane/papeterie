import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const [
      totalUsers,
      activeUsers,
      totalDrivers,
      activeDrivers,
      totalOrders,
      pendingOrders,
      completedOrders,
      cancelledOrders,
      totalStores,
      totalCategories,
      totalProducts,
      countries,
      serviceAreas,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { status: "Active" } }),
      prisma.driver.count(),
      prisma.driver.count({ where: { status: "Online" } }),
      prisma.order.count(),
      prisma.order.count({ where: { status: "Pending" } }),
      prisma.order.count({ where: { status: "Completed" } }),
      prisma.order.count({ where: { status: "Cancelled" } }),
      prisma.store.count({ where: { status: "Active" } }),
      prisma.category.count({ where: { status: "Active" } }),
      prisma.product.count({ where: { status: "Active" } }),
      prisma.country.count({ where: { status: "Active" } }),
      prisma.serviceArea.count({ where: { status: "Active" } }),
    ])

    // Revenue totals
    const revenueResult = await prisma.order.aggregate({
      where: { status: "Completed" },
      _sum: { total: true, earning: true },
    })
    const totalRevenue = revenueResult._sum.total ?? 0
    const totalEarnings = revenueResult._sum.earning ?? 0

    // Promo discounts
    const promoResult = await prisma.transaction.aggregate({
      where: { type: "Debit", description: { contains: "promo" } },
      _sum: { amount: true },
    })
    const totalDiscounts = promoResult._sum.amount ?? 0

    // Low stock products (stock <= 10)
    const lowStock = await prisma.product.findMany({
      where: { stock: { lte: 10 }, status: "Active" },
      include: { store: { select: { name: true } } },
      orderBy: { stock: "asc" },
      take: 10,
    })

    // Last 7 days order chart
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)
    sevenDaysAgo.setHours(0, 0, 0, 0)

    const recentOrders = await prisma.order.findMany({
      where: { createdAt: { gte: sevenDaysAgo } },
      select: { createdAt: true, total: true, earning: true },
    })

    // Build daily chart data
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date()
      d.setDate(d.getDate() - (6 - i))
      d.setHours(0, 0, 0, 0)
      return d
    })

    const chartData = days.map((day) => {
      const label = day.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric" })
      const dayOrders = recentOrders.filter((o) => {
        const od = new Date(o.createdAt)
        return od.getDate() === day.getDate() && od.getMonth() === day.getMonth()
      })
      return {
        name: label,
        commandes: dayOrders.length,
        revenus: dayOrders.reduce((s, o) => s + o.total, 0),
      }
    })

    // Category breakdown for pie chart
    const categoryStats = await prisma.category.findMany({
      where: { status: "Active", parentCategory: null },
      select: { name: true },
      take: 6,
    })

    return NextResponse.json({
      site: {
        totalUsers,
        activeUsers,
        totalDrivers,
        activeDrivers,
        countries,
        serviceAreas,
        totalRevenue,
        totalEarnings,
        totalDiscounts,
      },
      store: {
        totalStores,
        totalCategories,
        totalProducts,
        totalOrders,
        pendingOrders,
        completedOrders,
        cancelledOrders,
      },
      lowStock: lowStock.map((p) => ({
        id: p.id,
        name: p.name,
        stock: p.stock,
        store: p.store.name,
      })),
      chartData,
      categoryStats: categoryStats.map((c, i) => ({
        name: c.name,
        value: Math.floor(Math.random() * 300 + 50), // Replace with real sales data when available
        color: ["#4F46E5", "#06B6D4", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"][i % 6],
      })),
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erreur serveur"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
