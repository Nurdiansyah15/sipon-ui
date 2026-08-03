<script setup lang="ts">
import { usePsbStore } from '~/stores/psb'

definePageMeta({ layout: 'default' })

const psbStore = usePsbStore()
const router = useRouter()

onMounted(async () => {
  await psbStore.fetchRiwayat()
  await psbStore.fetchPendaftaran()
})
</script>

<template>
  <div class="mx-auto max-w-7xl px-4 py-8">
    <div class="mb-8">
      <UButton color="neutral" variant="ghost" icon="i-lucide-arrow-left" size="sm" class="mb-3" @click="router.push('/psb')" />
      <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Riwayat Pendaftaran</h1>
      <p class="mt-1 text-sm text-gray-500">Lacak perkembangan dan catatan review pendaftaran Anda.</p>
    </div>

    <div class="lg:grid lg:grid-cols-3 lg:items-start lg:gap-8">
      <!-- Status sidebar -->
      <div v-if="psbStore.pendaftar" class="mb-6 lg:sticky lg:top-24 lg:col-span-1 lg:mb-0">
        <div class="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700/50 dark:bg-gray-900">
          <p class="text-sm text-gray-500">Status Saat Ini</p>
          <div class="mt-2">
            <PsbStatusBadge :status="psbStore.pendaftar.status" size="md" />
          </div>
          <div class="mt-4 border-t border-gray-100 pt-4 dark:border-gray-800">
            <p class="text-xs text-gray-400">NIS</p>
            <p class="font-mono text-sm font-medium text-gray-900 dark:text-gray-100">{{ psbStore.pendaftar.nis || '—' }}</p>
          </div>
        </div>
      </div>

      <!-- Timeline -->
      <div :class="psbStore.pendaftar ? 'lg:col-span-2' : 'lg:col-span-3'">
        <div class="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700/50 dark:bg-gray-900">
          <h3 class="mb-5 font-semibold text-gray-900 dark:text-gray-100">Riwayat Review</h3>
          <PsbReviewTimeline :items="psbStore.reviews" :loading="psbStore.isLoading" />
        </div>
      </div>
    </div>
  </div>
</template>
