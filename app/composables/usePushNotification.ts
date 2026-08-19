import { useAuthStore } from '~/stores/auth'
import { DEVICE_STORAGE_KEY } from '~/utils/storageKeys'
import type { MessagePayload } from 'firebase/messaging'

function getStoredToken(): string | null {
  if (!import.meta.client) return null
  return localStorage.getItem(DEVICE_STORAGE_KEY)
}

function storeToken(token: string) {
  if (!import.meta.client) return
  localStorage.setItem(DEVICE_STORAGE_KEY, token)
}

function clearStoredToken() {
  if (!import.meta.client) return
  localStorage.removeItem(DEVICE_STORAGE_KEY)
}

function detectPlatform(): string {
  if (!import.meta.client) return 'web'
  const ua = navigator.userAgent.toLowerCase()
  if (/android/.test(ua)) return 'android'
  if (/iphone|ipad/.test(ua)) return 'ios'
  return 'web'
}

export function usePushNotification() {
  const api = useApi()
  const authStore = useAuthStore()
  const config = useRuntimeConfig()
  const vapidKey = config.public.firebaseVapidKey as string

  let foregroundUnsub: (() => void) | null = null

  async function loadFirebase() {
    const { requestFCMToken, onForegroundMessage } = await import('~/lib/firebase')
    return { requestFCMToken, onForegroundMessage }
  }

  async function registerDevice(): Promise<boolean> {
    if (!authStore.isLoggedIn || !vapidKey) return false

    const { requestFCMToken } = await loadFirebase()
    const token = await requestFCMToken(vapidKey)
    if (!token) return false

    const stored = getStoredToken()
    if (stored === token) return true

    try {
      await api.post('/api/v1/web/notifications/devices', {
        platform: detectPlatform(),
        push_provider: 'fcm',
        provider_token: token,
      })
      storeToken(token)
      return true
    }
    catch (err) {
      console.error('[FCM] failed to register device:', err)
      return false
    }
  }

  async function unregisterDevice(): Promise<void> {
    const token = getStoredToken()
    if (!token) return

    try {
      await api.delete('/api/v1/web/notifications/devices', {
        body: { provider_token: token },
      })
    }
    catch {
      // best-effort
    }
    finally {
      clearStoredToken()
    }
  }

  async function listenForeground(handler: (payload: MessagePayload) => void) {
    if (foregroundUnsub) return
    const { onForegroundMessage } = await loadFirebase()
    foregroundUnsub = onForegroundMessage(handler) ?? null
  }

  function stopForeground() {
    foregroundUnsub?.()
    foregroundUnsub = null
  }

  return {
    registerDevice,
    unregisterDevice,
    listenForeground,
    stopForeground,
  }
}
