"use client"

import { Suspense, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Save, MapPin, Phone, Mail, Clock, Camera, Loader2, Plus, Trash2 } from "lucide-react"

const days = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"]

function ProfileContent() {
  const searchParams = useSearchParams()
  const storeId = searchParams.get("store") ?? "1"

  const [profile, setProfile] = useState({
    name: "Marché Rufisque",
    description: "Le marché de Rufisque vous propose des plats traditionnels sénégalais préparés avec des ingrédients frais du terroir.",
    phone: "+221 78 738 6565",
    email: "marcherufisque25@gmail.com",
    address: "Marché Central, Rufisque, Dakar",
    minOrder: "2000",
    deliveryFee: "500",
    deliveryTime: "30-45",
  })

  const [hours, setHours] = useState(
    days.map(d => ({ day: d, open: d !== "Dimanche", from: "08:00", to: "22:00" }))
  )

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-xl font-bold text-gray-800">Profil du magasin</h1>
        <p className="text-sm text-gray-500">Informations visibles par vos clients</p>
      </div>

      {/* Logo */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h2 className="font-semibold text-gray-800 mb-4">Photo & identité</h2>
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-20 h-20 bg-amber-100 rounded-2xl flex items-center justify-center text-4xl">🏪</div>
            <button className="absolute -bottom-1 -right-1 w-7 h-7 bg-cyan-500 rounded-full flex items-center justify-center text-white shadow-md">
              <Camera size={14} />
            </button>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700">Photo du magasin</p>
            <p className="text-xs text-gray-400 mt-0.5">JPG, PNG · max 2MB · recommandé 400×400px</p>
            <button className="mt-2 text-xs text-cyan-500 hover:underline">Modifier la photo</button>
          </div>
        </div>
      </div>

      {/* Infos générales */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h2 className="font-semibold text-gray-800 mb-4">Informations générales</h2>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Nom du magasin</label>
            <input
              value={profile.name}
              onChange={e => setProfile({...profile, name: e.target.value})}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-300"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Description</label>
            <textarea
              value={profile.description}
              onChange={e => setProfile({...profile, description: e.target.value})}
              rows={3}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-300 resize-none"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1.5 flex items-center gap-1"><Phone size={12} /> Téléphone</label>
              <input
                value={profile.phone}
                onChange={e => setProfile({...profile, phone: e.target.value})}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-300"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1.5 flex items-center gap-1"><Mail size={12} /> Email</label>
              <input
                value={profile.email}
                onChange={e => setProfile({...profile, email: e.target.value})}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-300"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1.5 flex items-center gap-1"><MapPin size={12} /> Adresse</label>
            <input
              value={profile.address}
              onChange={e => setProfile({...profile, address: e.target.value})}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-300"
            />
          </div>
        </div>
      </div>

      {/* Livraison */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h2 className="font-semibold text-gray-800 mb-4">Paramètres de livraison</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Commande min. (FCFA)</label>
            <input
              value={profile.minOrder}
              onChange={e => setProfile({...profile, minOrder: e.target.value})}
              type="number"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-300"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Frais livraison (FCFA)</label>
            <input
              value={profile.deliveryFee}
              onChange={e => setProfile({...profile, deliveryFee: e.target.value})}
              type="number"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-300"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Délai (min)</label>
            <input
              value={profile.deliveryTime}
              onChange={e => setProfile({...profile, deliveryTime: e.target.value})}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-300"
            />
          </div>
        </div>
      </div>

      {/* Horaires */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2"><Clock size={16} /> Horaires d&apos;ouverture</h2>
        <div className="space-y-2.5">
          {hours.map((h, i) => (
            <div key={h.day} className="flex items-center gap-3">
              <div className="w-20 text-sm font-medium text-gray-700">{h.day}</div>
              <button
                onClick={() => setHours(hours.map((x, j) => j === i ? {...x, open: !x.open} : x))}
                className={`relative w-10 h-5 rounded-full transition-colors ${h.open ? "bg-cyan-500" : "bg-gray-200"}`}
              >
                <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${h.open ? "left-5" : "left-0.5"}`} />
              </button>
              {h.open ? (
                <>
                  <input
                    type="time"
                    value={h.from}
                    onChange={e => setHours(hours.map((x, j) => j === i ? {...x, from: e.target.value} : x))}
                    className="px-2 py-1 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-cyan-300"
                  />
                  <span className="text-gray-400 text-xs">—</span>
                  <input
                    type="time"
                    value={h.to}
                    onChange={e => setHours(hours.map((x, j) => j === i ? {...x, to: e.target.value} : x))}
                    className="px-2 py-1 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-cyan-300"
                  />
                </>
              ) : (
                <span className="text-xs text-gray-400">Fermé</span>
              )}
            </div>
          ))}
        </div>
      </div>

      <button className="flex items-center gap-2 px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm">
        <Save size={16} />
        Sauvegarder les modifications
      </button>
    </div>
  )
}

export default function MerchantProfilePage() {
  return (
    <Suspense fallback={<div className="flex justify-center pt-20"><Loader2 size={28} className="text-cyan-500 animate-spin" /></div>}>
      <ProfileContent />
    </Suspense>
  )
}
