import { OneSignal, LogLevel } from "react-native-onesignal"

const APP_ID = process.env.EXPO_PUBLIC_ONESIGNAL_APP_ID ?? ""

export function initOneSignal() {
  if (!APP_ID) {
    console.warn("[OneSignal] EXPO_PUBLIC_ONESIGNAL_APP_ID not set")
    return
  }

  OneSignal.Debug.setLogLevel(LogLevel.Warn)
  OneSignal.initialize(APP_ID)

  // Demander la permission push
  OneSignal.Notifications.requestPermission(true)

  // Listener : notification reçue en foreground
  OneSignal.Notifications.addEventListener("foregroundWillDisplay", (event) => {
    event.preventDefault()
    event.notification.display()
  })
}

export function setUserId(userId: string) {
  OneSignal.login(userId)
}

export function setUserTag(key: string, value: string) {
  OneSignal.User.addTag(key, value)
}

export function logout() {
  OneSignal.logout()
}

export function getSubscriptionId(): string | null {
  return OneSignal.User.pushSubscription.id ?? null
}

export function isSubscribed(): boolean {
  return OneSignal.User.pushSubscription.optedIn ?? false
}
