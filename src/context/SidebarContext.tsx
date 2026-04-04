"use client"

import { createContext, useContext, useState } from "react"

const SidebarContext = createContext<{
  open: boolean
  setOpen: (open: boolean) => void
  toggle: () => void
}>({
  open: false,
  setOpen: () => {},
  toggle: () => {},
})

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const toggle = () => setOpen(!open)

  return (
    <SidebarContext.Provider value={{ open, setOpen, toggle }}>
      {children}
    </SidebarContext.Provider>
  )
}

export const useSidebar = () => useContext(SidebarContext)
