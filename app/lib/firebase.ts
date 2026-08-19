import { initializeApp, type FirebaseApp } from 'firebase/app'
import {
  getMessaging,
  getToken,
  onMessage,
  type Messaging,
  type MessagePayload,
} from 'firebase/messaging'

let app: FirebaseApp | null = null
let messaging: Messaging | null = null

function getConfig() {
  const config = useRuntimeConfig()
  return {
    apiKey: config.public.firebaseApiKey as string,
    authDomain: config.public.firebaseAuthDomain as string,
    projectId: config.public.firebaseProjectId as string,
    storageBucket: config.public.firebaseStorageBucket as string,
    messagingSenderId: config.public.firebaseMessagingSenderId as string,
    appId: config.public.firebaseAppId as string,
  }
}

function isConfigValid(): boolean {
  const c = getConfig()
  return !!(c.apiKey && c.projectId && c.messagingSenderId && c.appId)
}

export function getFirebaseApp(): FirebaseApp | null {
  if (app) return app
  if (!isConfigValid()) return null
  app = initializeApp(getConfig())
  return app
}

export function getFirebaseMessaging(): Messaging | null {
  if (messaging) return messaging
  const fApp = getFirebaseApp()
  if (!fApp) return null
  messaging = getMessaging(fApp)
  return messaging
}

export async function requestFCMToken(vapidKey: string): Promise<string | null> {
  const m = getFirebaseMessaging()
  if (!m) {
    console.warn('[FCM] Firebase messaging tidak tersedia — cek konfigurasi Firebase di .env')
    return null
  }

  try {
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') {
      console.warn('[FCM] Izin notifikasi ditolak oleh user')
      return null
    }

    const token = await getToken(m, { vapidKey })
    console.info('[FCM] Token berhasil didapat')
    return token
  }
  catch (err) {
    console.error('[FCM] Gagal mendapatkan token:', err)
    return null
  }
}

export function onForegroundMessage(
  handler: (payload: MessagePayload) => void,
): (() => void) | null {
  const m = getFirebaseMessaging()
  if (!m) return null

  return onMessage(m, handler)
}
