"use client"

import { useState } from "react"
import { Plus, Download, Info, Search, RefreshCw, Edit, Trash2 } from "lucide-react"
import StatusBadge from "@/components/ui/StatusBadge"

const mockCategories = [
  // === LIVRES SCOLAIRES ===
  { id: 1,  segment: "Papeterie", name: "Livres Scolaires",               parent: "None",              status: "Active",   sequence: 1,  image: "📚", createdAt: "2025-01-15" },
  { id: 2,  segment: "Papeterie", name: "Livres CI & CP",                 parent: "Livres Scolaires",  status: "Active",   sequence: 1,  image: "🔤", createdAt: "2025-01-15" },
  { id: 3,  segment: "Papeterie", name: "Livres CE1 & CE2",               parent: "Livres Scolaires",  status: "Active",   sequence: 2,  image: "📖", createdAt: "2025-01-16" },
  { id: 4,  segment: "Papeterie", name: "Livres CM1 & CM2",               parent: "Livres Scolaires",  status: "Active",   sequence: 3,  image: "📗", createdAt: "2025-01-16" },
  { id: 5,  segment: "Papeterie", name: "Livres 6ème & 5ème",             parent: "Livres Scolaires",  status: "Active",   sequence: 4,  image: "📘", createdAt: "2025-01-17" },
  { id: 6,  segment: "Papeterie", name: "Livres 4ème & 3ème",             parent: "Livres Scolaires",  status: "Active",   sequence: 5,  image: "📙", createdAt: "2025-01-17" },
  { id: 7,  segment: "Papeterie", name: "Livres 2nde",                    parent: "Livres Scolaires",  status: "Active",   sequence: 6,  image: "📓", createdAt: "2025-01-18" },
  { id: 8,  segment: "Papeterie", name: "Livres 1ère",                    parent: "Livres Scolaires",  status: "Active",   sequence: 7,  image: "📔", createdAt: "2025-01-18" },
  { id: 9,  segment: "Papeterie", name: "Livres Terminale",               parent: "Livres Scolaires",  status: "Active",   sequence: 8,  image: "🎓", createdAt: "2025-01-19" },
  // === CAHIERS & BLOCS ===
  { id: 10, segment: "Papeterie", name: "Cahiers & Blocs-notes",          parent: "None",              status: "Active",   sequence: 2,  image: "📒", createdAt: "2025-01-19" },
  { id: 11, segment: "Papeterie", name: "Cahiers Petits Carreaux",        parent: "Cahiers & Blocs-notes", status: "Active", sequence: 1, image: "🗒️", createdAt: "2025-01-20" },
  { id: 12, segment: "Papeterie", name: "Cahiers Grands Carreaux Seyes",  parent: "Cahiers & Blocs-notes", status: "Active", sequence: 2, image: "📋", createdAt: "2025-01-20" },
  { id: 13, segment: "Papeterie", name: "Cahiers de Brouillon",           parent: "Cahiers & Blocs-notes", status: "Active", sequence: 3, image: "📝", createdAt: "2025-01-21" },
  { id: 14, segment: "Papeterie", name: "Cahiers de Dessin & Croquis",    parent: "Cahiers & Blocs-notes", status: "Active", sequence: 4, image: "🖼️", createdAt: "2025-01-21" },
  { id: 15, segment: "Papeterie", name: "Blocs-notes & Répertoires",      parent: "Cahiers & Blocs-notes", status: "Active", sequence: 5, image: "📑", createdAt: "2025-01-22" },
  // === STYLOS & CRAYONS ===
  { id: 16, segment: "Papeterie", name: "Stylos & Crayons",               parent: "None",              status: "Active",   sequence: 3,  image: "✏️", createdAt: "2025-01-22" },
  { id: 17, segment: "Papeterie", name: "Stylos Bille",                   parent: "Stylos & Crayons",  status: "Active",   sequence: 1,  image: "🖊️", createdAt: "2025-01-23" },
  { id: 18, segment: "Papeterie", name: "Stylos Plume & Encre",           parent: "Stylos & Crayons",  status: "Active",   sequence: 2,  image: "✒️", createdAt: "2025-01-23" },
  { id: 19, segment: "Papeterie", name: "Crayons de Bois",                parent: "Stylos & Crayons",  status: "Active",   sequence: 3,  image: "✏️", createdAt: "2025-01-24" },
  { id: 20, segment: "Papeterie", name: "Feutres & Marqueurs",            parent: "Stylos & Crayons",  status: "Active",   sequence: 4,  image: "🖌️", createdAt: "2025-01-24" },
  { id: 21, segment: "Papeterie", name: "Surligneur & Correcteur",        parent: "Stylos & Crayons",  status: "Active",   sequence: 5,  image: "🖋️", createdAt: "2025-01-25" },
  // === MATÉRIEL DE GÉOMÉTRIE ===
  { id: 22, segment: "Papeterie", name: "Matériel de Géométrie",          parent: "None",              status: "Active",   sequence: 4,  image: "📐", createdAt: "2025-01-25" },
  { id: 23, segment: "Papeterie", name: "Compas & Équerres",              parent: "Matériel de Géométrie", status: "Active", sequence: 1, image: "📐", createdAt: "2025-01-26" },
  { id: 24, segment: "Papeterie", name: "Règles & Rapporteurs",           parent: "Matériel de Géométrie", status: "Active", sequence: 2, image: "📏", createdAt: "2025-01-26" },
  { id: 25, segment: "Papeterie", name: "Calculatrices Scientifiques",    parent: "Matériel de Géométrie", status: "Active", sequence: 3, image: "🔢", createdAt: "2025-01-27" },
  // === ART & CRÉATIVITÉ ===
  { id: 26, segment: "Papeterie", name: "Art & Créativité",               parent: "None",              status: "Active",   sequence: 5,  image: "🎨", createdAt: "2025-01-27" },
  { id: 27, segment: "Papeterie", name: "Peintures & Gouaches",           parent: "Art & Créativité",  status: "Active",   sequence: 1,  image: "🖌️", createdAt: "2025-01-28" },
  { id: 28, segment: "Papeterie", name: "Crayons de Couleur",             parent: "Art & Créativité",  status: "Active",   sequence: 2,  image: "🖍️", createdAt: "2025-01-28" },
  { id: 29, segment: "Papeterie", name: "Papier Créatif & Origami",       parent: "Art & Créativité",  status: "Active",   sequence: 3,  image: "🎭", createdAt: "2025-01-29" },
  // === SACS & CARTABLES ===
  { id: 30, segment: "Papeterie", name: "Sacs & Cartables",               parent: "None",              status: "Active",   sequence: 6,  image: "🎒", createdAt: "2025-01-29" },
  { id: 31, segment: "Papeterie", name: "Cartables Maternelle & Primaire",parent: "Sacs & Cartables",  status: "Active",   sequence: 1,  image: "🎒", createdAt: "2025-01-30" },
  { id: 32, segment: "Papeterie", name: "Sacs à Dos Collège & Lycée",     parent: "Sacs & Cartables",  status: "Active",   sequence: 2,  image: "🎽", createdAt: "2025-01-30" },
  { id: 33, segment: "Papeterie", name: "Trousses & Pochettes",           parent: "Sacs & Cartables",  status: "Active",   sequence: 3,  image: "👜", createdAt: "2025-01-31" },
  // === DICTIONNAIRES ===
  { id: 34, segment: "Papeterie", name: "Dictionnaires & Encyclopédies",  parent: "None",              status: "Active",   sequence: 7,  image: "📚", createdAt: "2025-02-01" },
  { id: 35, segment: "Papeterie", name: "Dictionnaires Français",         parent: "Dictionnaires & Encyclopédies", status: "Active", sequence: 1, image: "🇫🇷", createdAt: "2025-02-01" },
  { id: 36, segment: "Papeterie", name: "Dictionnaires Anglais & Bilingues", parent: "Dictionnaires & Encyclopédies", status: "Active", sequence: 2, image: "🇬🇧", createdAt: "2025-02-02" },
  // === FOURNITURES DE CLASSE ===
  { id: 37, segment: "Papeterie", name: "Fournitures de Classe",          parent: "None",              status: "Active",   sequence: 8,  image: "✂️", createdAt: "2025-02-03" },
  { id: 38, segment: "Papeterie", name: "Classeurs & Porte-vues",         parent: "Fournitures de Classe", status: "Active", sequence: 1, image: "🗂️", createdAt: "2025-02-03" },
  { id: 39, segment: "Papeterie", name: "Colle & Adhésif",                parent: "Fournitures de Classe", status: "Active", sequence: 2, image: "📎", createdAt: "2025-02-04" },
  { id: 40, segment: "Papeterie", name: "Ciseaux & Taille-crayons",       parent: "Fournitures de Classe", status: "Active", sequence: 3, image: "✂️", createdAt: "2025-02-04" },
  { id: 41, segment: "Papeterie", name: "Gommes & Effaceurs",             parent: "Fournitures de Classe", status: "Active", sequence: 4, image: "🧽", createdAt: "2025-02-05" },
  { id: 42, segment: "Papeterie", name: "Protège-cahiers & Intercalaires",parent: "Fournitures de Classe", status: "Active", sequence: 5, image: "📂", createdAt: "2025-02-05" },
  // === SUPPORTS DE RÉVISION ===
  { id: 43, segment: "Papeterie", name: "Supports de Révision",           parent: "None",              status: "Active",   sequence: 9,  image: "📋", createdAt: "2025-02-06" },
  { id: 44, segment: "Papeterie", name: "Annales & Examens BFEM",         parent: "Supports de Révision", status: "Active", sequence: 1, image: "📜", createdAt: "2025-02-06" },
  { id: 45, segment: "Papeterie", name: "Annales & Examens Bac",          parent: "Supports de Révision", status: "Active", sequence: 2, image: "🏆", createdAt: "2025-02-07" },
  { id: 46, segment: "Papeterie", name: "Fiches de Révision",             parent: "Supports de Révision", status: "Active", sequence: 3, image: "🗃️", createdAt: "2025-02-07" },
  { id: 47, segment: "Papeterie", name: "Livrets d'Exercices",            parent: "Supports de Révision", status: "Active", sequence: 4, image: "📓", createdAt: "2025-02-08" },
  // === INFORMATIQUE SCOLAIRE ===
  { id: 48, segment: "Papeterie", name: "Informatique Scolaire",          parent: "None",              status: "Active",   sequence: 10, image: "💻", createdAt: "2025-02-10" },
  { id: 49, segment: "Papeterie", name: "Clés USB & Stockage",            parent: "Informatique Scolaire", status: "Active", sequence: 1, image: "💾", createdAt: "2025-02-10" },
  { id: 50, segment: "Papeterie", name: "Accessoires Informatique",       parent: "Informatique Scolaire", status: "Active", sequence: 2, image: "🖥️", createdAt: "2025-02-11" },
]

export default function CategoriesPage() {
  const [search, setSearch] = useState("")

  const filtered = mockCategories.filter((c) =>
    !search || c.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <span>🎒</span>
          <h1 className="text-lg font-semibold text-gray-700">Catégories — Fournitures Scolaires</h1>
        </div>
        <div className="flex gap-2">
          <button className="w-8 h-8 bg-green-500 hover:bg-green-600 text-white rounded-lg flex items-center justify-center"><Download size={16} /></button>
          <button className="w-8 h-8 bg-green-500 hover:bg-green-600 text-white rounded-lg flex items-center justify-center"><Plus size={16} /></button>
          <button className="w-8 h-8 bg-blue-500 hover:bg-blue-600 text-white rounded-lg flex items-center justify-center"><Info size={16} /></button>
        </div>
      </div>

      {/* Stats rapides */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        {[
          { label: "Total catégories", value: mockCategories.length, color: "bg-indigo-500" },
          { label: "Catégories parentes", value: mockCategories.filter(c => c.parent === "None").length, color: "bg-green-500" },
          { label: "Sous-catégories", value: mockCategories.filter(c => c.parent !== "None").length, color: "bg-cyan-500" },
          { label: "Actives", value: mockCategories.filter(c => c.status === "Active").length, color: "bg-orange-500" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 flex items-center gap-3">
            <div className={`w-8 h-8 ${s.color} rounded-lg flex items-center justify-center text-white font-bold text-sm`}>{s.value}</div>
            <span className="text-xs text-gray-600">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-4">
        <div className="flex gap-3">
          <input
            placeholder="Rechercher une catégorie..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 w-64"
          />
          <button className="p-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600"><Search size={16} /></button>
          <button onClick={() => setSearch("")} className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600"><RefreshCw size={16} /></button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-x-auto">
        <div className="p-3 border-b border-gray-50 flex justify-end items-center gap-2 text-xs text-gray-400">
          Rechercher : <input className="border border-gray-200 rounded px-2 py-1 ml-1 text-xs w-32 focus:outline-none" />
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {["N°", "Segment", "Nom", "Catégorie parente", "Statut", "Ordre", "Icône", "Créé le", "Action"].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-600 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map((cat, i) => (
              <tr key={cat.id} className={`hover:bg-gray-50/80 ${cat.parent === "None" ? "bg-indigo-50/30" : ""}`}>
                <td className="px-4 py-3 text-gray-500">{i + 1}</td>
                <td className="px-4 py-3">
                  <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium">{cat.segment}</span>
                </td>
                <td className="px-4 py-3">
                  <span className={`font-medium ${cat.parent === "None" ? "text-gray-900" : "text-gray-700 pl-3 border-l-2 border-indigo-200"}`}>
                    {cat.name}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">{cat.parent}</td>
                <td className="px-4 py-3"><StatusBadge status={cat.status} /></td>
                <td className="px-4 py-3 text-gray-700">{cat.sequence}</td>
                <td className="px-4 py-3 text-2xl">{cat.image}</td>
                <td className="px-4 py-3 text-xs text-gray-500">{cat.createdAt}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <button className="p-1.5 bg-blue-500 text-white rounded hover:bg-blue-600"><Edit size={12} /></button>
                    <button className="p-1.5 bg-red-500 text-white rounded hover:bg-red-600"><Trash2 size={12} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="p-3 text-xs text-gray-400 border-t">Affichage de 1 à {filtered.length} sur {mockCategories.length} entrées</div>
      </div>
    </div>
  )
}
