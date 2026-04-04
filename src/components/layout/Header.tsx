"use client"

import { ArrowLeft, Maximize2, Bell, Globe, ChevronDown, Menu, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useSidebar } from "@/context/SidebarContext"

export default function Header() {
  const router = useRouter()
  const [lang, setLang] = useState("Français")
  const { open, toggle } = useSidebar()

  return (
    <header className="h-14 bg-[#1A237E] flex items-center justify-between px-4 shadow-md sticky top-0 z-50">
      {/* Left */}
      <div className="flex items-center gap-3">
        {/* Mobile Toggle */}
        <button
          onClick={toggle}
          className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg md:hidden transition-colors"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>

        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow">
            <span className="text-indigo-900 text-sm font-bold">P</span>
          </div>
          <span className="text-white font-bold text-base md:text-lg tracking-wide">PAPETERIE</span>
          <span className="hidden lg:inline-block px-1.5 py-0.5 bg-yellow-400 text-indigo-900 text-[10px] font-black rounded uppercase ml-1">Admin</span>
        </div>
        <div className="hidden md:flex items-center gap-1 ml-4 border-l border-white/20 pl-4">
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
      <div className="flex items-center gap-2 md:gap-3">
        <button className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors relative">
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-400 border border-[#1A237E] rounded-full" />
        </button>
        <button className="hidden sm:flex items-center gap-1 text-white/90 hover:text-white text-sm px-2 py-1 hover:bg-white/10 rounded transition-colors">
          <Globe size={14} />
          {lang}
          <ChevronDown size={12} />
        </button>
        <div className="w-8 h-8 bg-green-500 border-2 border-white/20 rounded-full flex items-center justify-center shadow-lg text-white text-xs font-bold cursor-pointer">
          M
        </div>
      </div>
    </header>
  )
}
