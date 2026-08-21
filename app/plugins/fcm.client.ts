import { useAuthStore } from '~/stores/auth'
import { useNotificationStore } from '~/stores/notification'
import { usePushNotification } from '~/composables/usePushNotification'

export default defineNuxtPlugin(() => {
  if (!import.meta.client) return

  const authStore = useAuthStore()
  const notifStore = useNotificationStore()
  const push = usePushNotification()

  async function initPush() {
    if (!authStore.isLoggedIn) return

    const ok = await push.registerDevice()
    console.info('[FCM] registerDevice result:', ok)

    push.listenForeground((payload) => {
      notifStore.fetchUnreadCount()

      const title = payload.notification?.title || 'SIPON'
      const body = payload.notification?.body || ''

      if (Notification.permission === 'granted') {
        new Notification(title, { body, icon: '/logo.png' })
      }
    })
  }

  if (authStore.isLoggedIn) {
    initPush()
  }

  watch(() => authStore.isLoggedIn, (loggedIn) => {
    if (loggedIn) {
      initPush()
    }
    else {
      push.stopForeground()
    }
  })
})
