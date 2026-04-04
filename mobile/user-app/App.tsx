import React, { useEffect } from "react"
import { StatusBar } from "expo-status-bar"
import AppNavigator from "./src/navigation/AppNavigator"
import { initOneSignal } from "./src/services/onesignal"

export default function App() {
  useEffect(() => {
    initOneSignal()
  }, [])

  return (
    <>
      <StatusBar style="light" backgroundColor="#1A237E" />
      <AppNavigator />
    </>
  )
}
