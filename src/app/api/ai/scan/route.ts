import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const { image } = await req.json()
    
    if (!image) {
      return NextResponse.json({ error: "Image manquante" }, { status: 400 })
    }

    // Simuler un délai de traitement IA
    await new Promise(resolve => setTimeout(resolve, 2500))

    // Liste d'articles simulés trouvés sur la "photo"
    const mockItems = [
      { id: "1", name: "Cahier 200 pages Seyès", price: 1500, qty: 5, confidence: 0.98 },
      { id: "2", name: "Kit de géométrie (Règle, Équerre, Compas)", price: 3500, qty: 1, confidence: 0.95 },
      { id: "3", name: "Paquet de 12 Stylos Billes (Bic Blue)", price: 2000, qty: 1, confidence: 0.92 },
      { id: "4", name: "Calculatrice Scientifique", price: 12500, qty: 1, confidence: 0.88 },
      { id: "5", name: "Gomme blanche", price: 250, qty: 2, confidence: 0.99 },
    ]

    return NextResponse.json({
      success: true,
      message: "Analyse terminée avec succès",
      items: mockItems,
      totalCount: 10,
      estimatedPrice: 24750
    })
  } catch (error) {
    console.error("[AI-SCAN-ERROR]", error)
    return NextResponse.json({ error: "Erreur lors de l'analyse IA" }, { status: 500 })
  }
}
