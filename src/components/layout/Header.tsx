"use client"

import { ArrowLeft, Maximize2, Bell, Globe, ChevronDown } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"

export default function Header() {
  const router = useRouter()
  const [lang, setLang] = useState("Français")

  return (
    <header className="h-14 bg-[#6B6BD5] flex items-center justify-between px-4 shadow-md sticky top-0 z-30">
      {/* Left */}
      <div className="flex items-center gap-3">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow">
            <span className="text-green-600 text-sm font-bold">N</span>
          </div>
          <span className="text-white font-bold text-lg tracking-wide">NDUGUMi</span>
        </div>
        <div className="flex items-center gap-1 ml-2">
          <button
            onClick={() => router.back()}
            className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <button className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded transition-colors">
            <Maximize2 size={16} />
          </button>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-3">
        <button className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors relative">
          <Bell size={18} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-400 rounded-full" />
        </button>
        <button className="flex items-center gap-1 text-white/90 hover:text-white text-sm px-2 py-1 hover:bg-white/10 rounded transition-colors">
          <Globe size={14} />
          {lang}
          <ChevronDown size={12} />
        </button>
        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow text-white text-xs font-bold cursor-pointer">
          M
        </div>
      </div>
    </header>
  )
}
