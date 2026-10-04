import OneSignal from "react-onesignal"

export const ONESIGNAL_APP_ID = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID ?? ""

let initialized = false

export async function initOneSignal() {
  if (initialized || typeof window === "undefined" || !ONESIGNAL_APP_ID) return
  initialized = true

  await OneSignal.init({
    appId: ONESIGNAL_APP_ID,
    allowLocalhostAsSecureOrigin: true,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    notifyButton: { enable: false } as any,
    serviceWorkerParam: { scope: "/" },
  })
}

export async function subscribeUser() {
  await OneSignal.User.PushSubscription.optIn()
}

export async function unsubscribeUser() {
  await OneSignal.User.PushSubscription.optOut()
}

export async function getSubscriptionId(): Promise<string | null> {
  return OneSignal.User.PushSubscription.id ?? null
}

export async function isSubscribed(): Promise<boolean> {
  return OneSignal.User.PushSubscription.optedIn ?? false
}

export async function setExternalUserId(userId: string) {
  OneSignal.login(userId)
}

export async function sendTagToUser(key: string, value: string) {
  OneSignal.User.addTag(key, value)
}

/** Envoie une notification via l'API REST OneSignal (côté serveur uniquement) */
export async function sendPushNotification({
  appId,
  restApiKey,
  title,
  message,
  segments = ["All"],
  playerIds,
  externalIds,
  data,
}: {
  appId: string
  restApiKey: string
  title: string
  message: string
  segments?: string[]
  playerIds?: string[]
  externalIds?: string[] // id passés à OneSignal.login() par les applications
  data?: Record<string, string>
}) {
  const body: Record<string, unknown> = {
    app_id: appId,
    headings: { en: title, fr: title },
    contents: { en: message, fr: message },
    data,
  }

  if (externalIds && externalIds.length > 0) {
    // Envoi ciblé : ne JAMAIS retomber sur un segment global
    body.include_aliases = { external_id: externalIds }
    body.target_channel = "push"
  } else if (playerIds && playerIds.length > 0) {
    body.include_player_ids = playerIds
  } else {
    body.included_segments = segments
  }

  const res = await fetch("https://onesignal.com/api/v1/notifications", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${restApiKey}`,
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.json()
    throw new Error(err?.errors?.[0] ?? "OneSignal API error")
  }

  return res.json()
}
