"use client"

import { Star, MessageSquare } from "lucide-react"
import { useMerchant } from "../MerchantContext"

export default function MerchantReviews() {
  const { store } = useMerchant()
  const full = Math.round(store.rating)

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-xl font-bold text-gray-800">Évaluations clients</h1>
        <p className="text-sm text-gray-500">Note attribuée à votre boutique</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex items-center gap-6">
        <div className="text-center">
          <div className="text-4xl font-bold text-gray-800">{store.rating.toFixed(1)}</div>
          <div className="flex gap-0.5 mt-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star key={i} size={16} className={i <= full ? "text-amber-400 fill-amber-400" : "text-gray-200"} />
            ))}
          </div>
          <div className="text-xs text-gray-400 mt-1">sur 5</div>
        </div>
        <p className="text-sm text-gray-500">
          La note de la boutique est tenue par l&apos;administrateur Schoolmatik.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
        <MessageSquare size={32} className="text-gray-300 mx-auto mb-3" />
        <p className="text-sm text-gray-500">Les avis détaillés des clients ne sont pas encore collectés.</p>
        <p className="text-xs text-gray-400 mt-1">Ils apparaîtront ici dès que la notation après livraison sera activée.</p>
      </div>
    </div>
  )
}
