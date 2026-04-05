import { NextRequest, NextResponse } from "next/server"
import { sendPushNotification } from "@/lib/onesignal"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  try {
    const { title, message, segments, playerIds, imageUrl, notificationId } = await req.json()

    if (!title || !message) {
      return NextResponse.json({ error: "title et message sont requis" }, { status: 400 })
    }

    const appId = process.env.ONESIGNAL_APP_ID
    const restApiKey = process.env.ONESIGNAL_REST_API_KEY

    let onesignalResult: { id: string; recipients: number } | null = null

    if (appId && restApiKey) {
      onesignalResult = await sendPushNotification({
        appId,
        restApiKey,
        title,
        message,
        segments,
        playerIds,
        data: { imageUrl },
      })
    }

    // Save/update notification in DB
    if (notificationId) {
      await prisma.notification.update({
        where: { id: notificationId },
        data: { status: "Sent", sentAt: new Date() },
      })
    } else {
      await prisma.notification.create({
        data: {
          title,
          message,
          target: segments ? segments[0] : "All",
          imageUrl: imageUrl ?? null,
          status: "Sent",
          sentAt: new Date(),
        },
      })
    }

    return NextResponse.json({
      success: true,
      id: onesignalResult?.id ?? "local",
      recipients: onesignalResult?.recipients ?? 0,
      onesignalConfigured: !!(appId && restApiKey),
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Erreur inconnue"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
