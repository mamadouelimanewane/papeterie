const { PrismaClient } = require("@prisma/client")
const { PrismaPg } = require("@prisma/adapter-pg")
const { Pool } = require("pg")
const dotenv = require("dotenv")

dotenv.config()

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  const adapter = new PrismaPg(pool)
  const prisma = new PrismaClient({ adapter })

  try {
    console.log("Checking Admin table...")
    const adminCount = await prisma.admin.count()
    console.log("Admin count:", adminCount)

    console.log("Checking Driver table...")
    const driverCount = await prisma.driver.count()
    console.log("Driver count:", driverCount)
  } catch (err) {
    console.error("Diagnostic failed:", err.message)
    if (err.message.includes('relation "Admin" does not exist')) {
        console.log("CRITICAL: Table 'Admin' is missing. Needs migration.")
    }
  } finally {
    await pool.end()
  }
}

main()
