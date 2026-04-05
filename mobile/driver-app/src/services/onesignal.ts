import { OneSignal, LogLevel } from "react-native-onesignal"

const APP_ID = process.env.EXPO_PUBLIC_ONESIGNAL_APP_ID ?? ""

export function initOneSignal() {
  if (!APP_ID) {
    console.warn("[OneSignal] EXPO_PUBLIC_ONESIGNAL_APP_ID not set")
    return
  }

  OneSignal.Debug.setLogLevel(LogLevel.Warn)
  OneSignal.initialize(APP_ID)

  // Livreur : toujours autorisé (nécessaire pour recevoir les nouvelles commandes)
  OneSignal.Notifications.requestPermission(true)

  // Afficher les notifications même en foreground
  OneSignal.Notifications.addEventListener("foregroundWillDisplay", (event: any) => {
    event.preventDefault()
    event.notification.display()
  })
}

export function setDriverId(driverId: string) {
  OneSignal.login(driverId)
  OneSignal.User.addTag("role", "driver")
  OneSignal.User.addTag("driver_id", driverId)
}

export function setDriverOnlineStatus(isOnline: boolean) {
  OneSignal.User.addTag("status", isOnline ? "online" : "offline")
}

export function logout() {
  OneSignal.logout()
}

export function getPushId() {
  // @ts-ignore - SDK v5 specific access
  return OneSignal.User.pushSubscription.getUserId() ?? null
}

export function isPushEnabled() {
  // @ts-ignore
  return OneSignal.User.pushSubscription.getOptedIn() ?? false
}

