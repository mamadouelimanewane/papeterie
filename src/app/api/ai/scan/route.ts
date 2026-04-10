import { NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

// Initialisation de l'IA (clé à configurer dans les variables d'env)
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "")

export async function POST(req: Request) {
  try {
    const { image } = await req.json()
    
    if (!image) {
      return NextResponse.json({ error: "Image manquante" }, { status: 400 })
    }

    if (!process.env.GOOGLE_API_KEY) {
      console.warn("[AI-SCAN] API Key manquante, utilisation du mode simulateur")
      // Mode simulateur sécurisé si pas de clé
      await new Promise(resolve => setTimeout(resolve, 1500))
      return NextResponse.json({
        success: true,
        isMock: true,
        items: [
          { id: "1", name: "Cahier 200 pages (Détecté)", price: 1500, qty: 5, confidence: 0.95 },
          { id: "2", name: "Kit Géométrie (Détecté)", price: 3500, qty: 1, confidence: 0.92 }
        ],
        estimatedPrice: 11000
      })
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

    // Préparation de l'invite pour Gemini
    const prompt = `Analyses cette photo de liste scolaire et extrais les articles sous forme de JSON. 
    Format attendu: { "items": [{ "id": string, "name": string, "price": number, "qty": number, "confidence": number }], "estimatedPrice": number }
    Sois précis sur les quantités et estime un prix moyen en FCFA pour chaque article au Sénégal.`

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: image,
          mimeType: "image/jpeg"
        }
      }
    ])

    const response = await result.response
    const text = response.text()
    
    // Nettoyage de la réponse Markdown si nécessaire
    const cleanJson = text.replace(/```json|```/g, "").trim()
    const parsedData = JSON.parse(cleanJson)

    return NextResponse.json({
      success: true,
      ...parsedData
    })
  } catch (error) {
    console.error("[AI-SCAN-ERROR]", error)
    return NextResponse.json({ error: "Erreur lors de l'analyse IA réelle" }, { status: 500 })
  }
}
