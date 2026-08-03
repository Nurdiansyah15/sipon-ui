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
  <div class="mx-auto max-w-3xl px-4 py-8">
    <div class="mb-6">
      <UButton color="neutral" variant="ghost" icon="i-lucide-arrow-left" @click="router.push('/psb')">Kembali</UButton>
      <h1 class="mt-2 text-2xl font-bold text-gray-900 dark:text-gray-100">Riwayat Pendaftaran</h1>
    </div>

    <div v-if="psbStore.pendaftar" class="mb-6 flex items-center gap-3">
      <PsbStatusBadge :status="psbStore.pendaftar.status" size="md" />
      <span v-if="psbStore.pendaftar.nis" class="text-sm text-gray-500">NIS: {{ psbStore.pendaftar.nis }}</span>
    </div>

    <div class="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
      <PsbReviewTimeline :items="psbStore.reviews" :loading="psbStore.isLoading" />
    </div>
  </div>
</template>
