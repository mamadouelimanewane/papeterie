"use client"

import { Suspense, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Plus, Search, Edit, Trash2, Eye, EyeOff, ChevronDown, ChevronRight, Loader2 } from "lucide-react"

const categories = [
  {
    id: 1,
    name: "Livres Scolaires",
    products: [
      { id: 1,  name: "Lecture suivie CI-CP — Mon Premier Livre",                price: 2500,  description: "Manuel de lecture adapté au programme sénégalais CI-CP",           available: true,  orders: 145, image: "📚" },
      { id: 2,  name: "Mathématiques CE1-CE2 — Calcul Sénégal",                  price: 3000,  description: "Livre de maths programme national CE1-CE2",                          available: true,  orders: 98,  image: "📗" },
      { id: 3,  name: "Français CM1-CM2 — Grammaire & Conjugaison",              price: 2800,  description: "Livre de français programme officiel CM1-CM2",                       available: true,  orders: 112, image: "📘" },
      { id: 4,  name: "Histoire-Géographie 6ème Sénégal",                        price: 3500,  description: "Manuel complet d'histoire-géographie pour la 6ème",                  available: true,  orders: 76,  image: "🗺️" },
      { id: 5,  name: "Sciences de la Vie et de la Terre 5ème",                  price: 4000,  description: "SVT 5ème — programme officiel national",                             available: true,  orders: 54,  image: "🔬" },
      { id: 6,  name: "Mathématiques 4ème — Algèbre & Géométrie",               price: 4200,  description: "Programme national 4ème, exercices corrigés inclus",                  available: true,  orders: 67,  image: "📐" },
      { id: 7,  name: "Français 3ème — Littérature & Expression",                price: 3800,  description: "Préparation BFEM — littérature, grammaire, rédaction",               available: true,  orders: 88,  image: "✍️" },
      { id: 8,  name: "Physique-Chimie 2nde",                                    price: 4500,  description: "Programme 2nde lycée — cours et exercices",                          available: true,  orders: 43,  image: "⚗️" },
      { id: 9,  name: "Mathématiques 1ère S — Analyse & Probabilités",           price: 5000,  description: "Programme 1ère série scientifique Sénégal",                          available: true,  orders: 61,  image: "📓" },
      { id: 10, name: "Mathématiques Terminale S — Analyse & Algèbre",           price: 5500,  description: "Complet pour les Terminales scientifiques — prépa Bac",              available: true,  orders: 89,  image: "🎓" },
      { id: 11, name: "Philosophie Terminale — Manuel & Exercices",              price: 4800,  description: "Toutes séries Terminale — auteurs et dissertations",                 available: false, orders: 34,  image: "💭" },
    ]
  },
  {
    id: 2,
    name: "Cahiers & Blocs-notes",
    products: [
      { id: 12, name: "Cahier 100 pages petits carreaux 5×5",                    price: 500,   description: "Format 17×22 cm, couverture cartonnée, lignes bleues",              available: true,  orders: 420, image: "📒" },
      { id: 13, name: "Cahier 200 pages grands carreaux Seyes",                  price: 800,   description: "Format 21×29.7 cm — idéal primaire et collège",                    available: true,  orders: 380, image: "🗒️" },
      { id: 14, name: "Cahier de brouillon 96 pages",                            price: 300,   description: "Brouillon économique papier recyclé pour tous niveaux",              available: true,  orders: 650, image: "📝" },
      { id: 15, name: "Cahier de dessin A4 40 pages",                            price: 600,   description: "Papier épais 90g/m² pour dessins et créations artistiques",          available: true,  orders: 220, image: "🖼️" },
      { id: 16, name: "Bloc-notes ligné A5 80 pages",                            price: 700,   description: "Spirale perforée, couverture rigide — lycée & collège",              available: true,  orders: 175, image: "📑" },
    ]
  },
  {
    id: 3,
    name: "Stylos & Crayons",
    products: [
      { id: 17, name: "Stylo bille BIC Cristal — Lot de 10",                     price: 1200,  description: "Stylos bille bleu/noir/rouge assortis — écriture fluide",            available: true,  orders: 560, image: "🖊️" },
      { id: 18, name: "Stylo plume Schneider avec cartouches",                   price: 2500,  description: "Plume pour calligraphie et écriture cursive — 10 cartouches inclus", available: true,  orders: 98,  image: "✒️" },
      { id: 19, name: "Crayon de bois HB — Lot de 12",                           price: 800,   description: "Crayons de qualité supérieure, faciles à affûter",                   available: true,  orders: 430, image: "✏️" },
      { id: 20, name: "Feutres de coloriage lavables — Boîte 24 couleurs",       price: 2500,  description: "Feutres lavables pour CI-CM2 — pigments vifs résistants",            available: true,  orders: 280, image: "🖌️" },
      { id: 21, name: "Surligneur fluo — Lot de 5 couleurs",                     price: 900,   description: "5 couleurs vives — collège et lycée — pointe biseautée",             available: true,  orders: 215, image: "🖋️" },
      { id: 22, name: "Correcteur liquide blanc Tipp-Ex",                        price: 500,   description: "Séchage rapide, couverture opaque — 20ml",                           available: true,  orders: 340, image: "📌" },
    ]
  },
  {
    id: 4,
    name: "Matériel de Géométrie",
    products: [
      { id: 23, name: "Compas scolaire métal avec crayon intégré",               price: 1500,  description: "Compas robuste pour collège et lycée — précision garantie",          available: true,  orders: 195, image: "📐" },
      { id: 24, name: "Règle 30cm + Équerre + Rapporteur — Kit complet",         price: 1200,  description: "Kit géométrie 3 pièces en plastique rigide transparent",             available: true,  orders: 342, image: "📏" },
      { id: 25, name: "Calculatrice scientifique Casio FX-82ES",                 price: 12000, description: "Indispensable dès la 3ème — autorisée examens BFEM et Bac",          available: true,  orders: 67,  image: "🔢" },
      { id: 26, name: "Rapporteur demi-cercle 180°",                             price: 400,   description: "Plastique transparent gradué — angles précis",                       available: true,  orders: 128, image: "📐" },
    ]
  },
  {
    id: 5,
    name: "Art & Créativité",
    products: [
      { id: 27, name: "Crayons de couleur — Boîte 36 couleurs",                  price: 3500,  description: "Crayons fondants pour illustrations et projets artistiques",          available: true,  orders: 164, image: "🖍️" },
      { id: 28, name: "Peinture gouache 12 couleurs — Tubes 10ml",               price: 4200,  description: "Gouache opaque, séchage rapide — 12 couleurs primaires et dérivées", available: true,  orders: 89,  image: "🖌️" },
      { id: 29, name: "Papier créatif origami A4 — 50 feuilles colorées",        price: 1500,  description: "50 feuilles 80g en 10 couleurs vives — pliages et créations",         available: true,  orders: 112, image: "🎭" },
    ]
  },
  {
    id: 6,
    name: "Sacs & Cartables",
    products: [
      { id: 30, name: "Cartable maternelle CI-CP — 32cm léger",                  price: 8500,  description: "Sac enfant ergonomique avec poches compartimentées — 3 couleurs",   available: true,  orders: 78,  image: "🎒" },
      { id: 31, name: "Cartable primaire CE-CM — 38cm renforcé",                 price: 11000, description: "Dos moulé, bretelles réglables, imperméable — 5 couleurs dispo",    available: true,  orders: 65,  image: "🎒" },
      { id: 32, name: "Sac à dos lycée & collège — 40L ergonomique",             price: 15000, description: "Grande capacité, 3 compartiments, port USB, renforcé",               available: true,  orders: 45,  image: "👜" },
      { id: 33, name: "Trousse garnie primaire — 12 pièces",                     price: 3500,  description: "Trousse + crayons + règle + gomme + taille-crayon — tout inclus",   available: true,  orders: 198, image: "🎽" },
      { id: 34, name: "Trousse souple lycée — vide",                             price: 1200,  description: "Grande trousse robuste polyester — fermeture éclair",                available: true,  orders: 142, image: "👜" },
    ]
  },
  {
    id: 7,
    name: "Supports de Révision",
    products: [
      { id: 35, name: "Annales BFEM 2020-2025 — Toutes matières",                price: 3500,  description: "5 ans d'annales corrigés — Maths, Français, SVT, HG, Physique",     available: true,  orders: 210, image: "📜" },
      { id: 36, name: "Annales Bac S 2020-2025 — Sciences",                      price: 4500,  description: "5 ans d'annales — Maths, Physique, SVT, Philo séries S",             available: true,  orders: 187, image: "🏆" },
      { id: 37, name: "Annales Bac L 2020-2025 — Lettres",                       price: 4000,  description: "5 ans d'annales — Français, Philosophie, Histoire, Géographie",      available: true,  orders: 134, image: "📜" },
      { id: 38, name: "Fiches de révision Maths Terminale",                      price: 2000,  description: "50 fiches synthèse — formules clés et exercices types",              available: true,  orders: 98,  image: "🗃️" },
      { id: 39, name: "Dictionnaire Larousse de Poche 2025",                     price: 5500,  description: "160 000 mots, expressions, 80 000 noms propres",                     available: true,  orders: 76,  image: "📚" },
      { id: 40, name: "Dictionnaire Anglais-Français Bilingue",                  price: 4800,  description: "60 000 entrées — collège, lycée et préparation examens",             available: false, orders: 45,  image: "🇬🇧" },
    ]
  },
  {
    id: 8,
    name: "Fournitures de Classe",
    products: [
      { id: 41, name: "Classeur A4 — 4 anneaux 30mm",                            price: 1500,  description: "Classeur rigide avec étiquette de dos — plusieurs couleurs",         available: true,  orders: 265, image: "🗂️" },
      { id: 42, name: "Porte-vues A4 — 60 pochettes",                            price: 1200,  description: "Album de présentation cristal — 60 vues transparentes",              available: true,  orders: 198, image: "📂" },
      { id: 43, name: "Colle en bâton Pritt 22g",                                price: 400,   description: "Colle solide repositionnable — sèche transparente, non toxique",     available: true,  orders: 345, image: "📎" },
      { id: 44, name: "Ciseaux scolaires 17cm — embout arrondi",                 price: 700,   description: "Ciseaux sécurisés primaire — lames acier inox — ambidextre",         available: true,  orders: 220, image: "✂️" },
      { id: 45, name: "Taille-crayon double trou avec réservoir",                price: 300,   description: "Double trou pour crayons standards et gros — plastique ABS",         available: true,  orders: 412, image: "✏️" },
      { id: 46, name: "Gomme blanche Stabilo — Lot de 3",                        price: 500,   description: "Efface proprement sans abîmer le papier — 60×23×12mm",               available: true,  orders: 380, image: "🧽" },
      { id: 47, name: "Protège-cahier transparent A4 — Lot de 10",               price: 1000,  description: "Protège-cahiers incolores ajustables — universels toutes couvertures",available: true,  orders: 290, image: "📋" },
    ]
  },
]

function ProductsContent() {
  const searchParams = useSearchParams()
  const storeId = searchParams.get("store") ?? "1"
  const [search, setSearch] = useState("")
  const [expanded, setExpanded] = useState<number[]>([1, 2, 3, 4, 5, 6, 7, 8])
  const [editModal, setEditModal] = useState<number | null>(null)

  const toggleCategory = (id: number) => {
    setExpanded(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const allProducts = categories.flatMap(c => c.products)
  const filteredCategories = categories.map(cat => ({
    ...cat,
    products: cat.products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
  })).filter(cat => cat.products.length > 0)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Catalogue — Mon École</h1>
          <p className="text-sm text-gray-500">{allProducts.length} produits · {categories.length} catégories · Papeterie scolaire CI → Terminale</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm">
          <Plus size={16} />
          Nouveau produit
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border border-gray-100 p-3 text-center">
          <div className="text-xl font-bold text-gray-800">{allProducts.length}</div>
          <div className="text-xs text-gray-500">Total produits</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-3 text-center">
          <div className="text-xl font-bold text-green-600">{allProducts.filter(p => p.available).length}</div>
          <div className="text-xs text-gray-500">Disponibles</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-3 text-center">
          <div className="text-xl font-bold text-red-500">{allProducts.filter(p => !p.available).length}</div>
          <div className="text-xs text-gray-500">Indisponibles</div>
        </div>
      </div>

      {/* Search */}
      <div className="flex gap-2">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher produit scolaire..."
            className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
        </div>
        <button className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors">
          <Plus size={14} />
          Catégorie
        </button>
      </div>

      {/* Categories & Products */}
      <div className="space-y-3">
        {filteredCategories.map(cat => (
          <div key={cat.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Category header */}
            <button
              onClick={() => toggleCategory(cat.id)}
              className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-gray-50/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                {expanded.includes(cat.id)
                  ? <ChevronDown size={18} className="text-gray-400" />
                  : <ChevronRight size={18} className="text-gray-400" />}
                <span className="font-semibold text-gray-800">{cat.name}</span>
                <span className="text-xs text-gray-400 bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full">{cat.products.length}</span>
              </div>
              <button
                onClick={e => { e.stopPropagation() }}
                className="flex items-center gap-1 text-xs text-indigo-500 hover:underline"
              >
                <Plus size={13} /> Ajouter
              </button>
            </button>

            {/* Products */}
            {expanded.includes(cat.id) && (
              <div className="border-t border-gray-50 divide-y divide-gray-50">
                {cat.products.map(product => (
                  <div key={product.id} className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50/40 transition-colors">
                    <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                      {product.image}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-800 text-sm">{product.name}</span>
                        {!product.available && (
                          <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">Indisponible</span>
                        )}
                      </div>
                      <div className="text-xs text-gray-400 truncate">{product.description}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{product.orders} commandes</div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="font-bold text-gray-800 text-sm">{product.price.toLocaleString("fr-FR")} FCFA</div>
                      <div className="flex items-center gap-1 mt-1 justify-end">
                        <button
                          className={`p-1.5 rounded-lg transition-colors ${product.available ? "text-green-500 hover:bg-green-50" : "text-gray-400 hover:bg-gray-100"}`}
                          title={product.available ? "Désactiver" : "Activer"}
                        >
                          {product.available ? <Eye size={15} /> : <EyeOff size={15} />}
                        </button>
                        <button className="p-1.5 text-indigo-500 hover:bg-indigo-50 rounded-lg transition-colors">
                          <Edit size={15} />
                        </button>
                        <button className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default function MerchantProductsPage() {
  return (
    <Suspense fallback={<div className="flex justify-center pt-20"><Loader2 size={28} className="text-indigo-500 animate-spin" /></div>}>
      <ProductsContent />
    </Suspense>
  )
}
