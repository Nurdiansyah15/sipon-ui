<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'

const api = useApi()

definePageMeta({ layout: 'default' })

const authStore = useAuthStore()
const sending = ref(false)
const status = ref('')

const displayName = computed(() => authStore.user?.fullname || authStore.user?.username || '')

async function triggerNotification() {
  sending.value = true
  status.value = ''

  try {
    await api.post('/api/v1/web/notifications/test', {
      title: 'Tunggakan Syahriah',
      body: `Halo ${displayName.value || 'user'}, kamu nunggak syahriah, cpeet bayar !!! `,
      topic: 'sipon_test',
      data: {
        type: 'test',
        route: '/dashboard',
      },
    })
    status.value = 'Notifikasi berhasil dikirim.'
  } catch (error) {
    const message = error && typeof error === 'object' && 'data' in error ? (error as { data?: { message?: string } }).data?.message : 'Gagal mengirim notifikasi.'
    status.value = message || 'Gagal mengirim notifikasi.'
  } finally {
    sending.value = false
  }
}
</script>

<template>
  <div>
    <HeroBanner />
    <div class="mx-auto max-w-7xl px-4 py-6 space-y-4">
      <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Selamat datang, {{ displayName }}!</h2>

      <div class="flex flex-wrap items-center gap-3">
        <UButton
          color="primary"
          :loading="sending"
          :disabled="sending"
          @click="triggerNotification"
        >
          Trigger push notif
        </UButton>

        <span v-if="status" class="text-sm text-gray-600 dark:text-gray-300">{{ status }}</span>
      </div>
    </div>
    <FeatureModuleGrid />
  </div>
</template>
