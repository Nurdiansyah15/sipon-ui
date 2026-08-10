<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'
import { useDashboardStore } from '~/stores/dashboard'
import { parseApiError } from '~/utils/errorParser'

definePageMeta({ layout: 'default' })

const authStore = useAuthStore()
const dashboardStore = useDashboardStore()
const toast = useToast()

const displayName = computed(() => authStore.user?.fullname || authStore.user?.username || '')

onMounted(async () => {
  try {
    await dashboardStore.fetchAll()
  } catch (err) {
    toast.add({ title: 'Gagal memuat data', description: parseApiError(err), color: 'error' })
  }
})
</script>

<template>
  <div>
    <HeroBanner />
    <div class="mx-auto max-w-7xl px-4 py-6">
      <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Selamat datang, {{ displayName }}!</h2>
    </div>

    <div v-if="dashboardStore.isLoading" class="mx-auto max-w-7xl space-y-6 px-4 py-4">
      <USkeleton class="h-48 w-full rounded-lg" />
      <USkeleton class="h-48 w-full rounded-lg" />
      <USkeleton class="h-48 w-full rounded-lg" />
    </div>

    <div v-else class="mx-auto max-w-7xl space-y-6 px-4 py-4">
      <DashboardArticleSection />
      <DashboardSantriCard />
      <DashboardBillingCard />
    </div>
  </div>
</template>
