<script setup lang="ts">
import { useAkademikSantriStore } from '~/stores/akademik-santri'
import { parseApiError } from '~/utils/errorParser'

definePageMeta({ layout: 'default' })

const store = useAkademikSantriStore()
const router = useRouter()
const toast = useToast()

onMounted(async () => {
  if (!store.summary) {
    try {
      await store.fetchSummary()
    } catch (err) {
      toast.add({ title: 'Gagal memuat data', description: parseApiError(err), color: 'error' })
    }
  }
  try {
    await store.fetchActivities()
  } catch (err) {
    toast.add({ title: 'Gagal memuat data', description: parseApiError(err), color: 'error' })
  }
})
</script>

<template>
  <div class="mx-auto max-w-7xl px-4 py-8">
    <UButton variant="ghost" icon="i-lucide-arrow-left" to="/akademik" class="mb-4">Kembali ke Akademik</UButton>

    <div class="mb-8">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Kegiatan Wajib</h1>
      <p class="mt-1 text-sm text-gray-500">
        Kegiatan yang menjadi kewajiban Anda pada periode
        <span v-if="store.activePeriod" class="font-medium text-gray-700 dark:text-gray-300">{{ store.activePeriod.name }}</span>
        <span v-else>akademik</span>.
      </p>
    </div>

    <div v-if="store.isLoading" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <USkeleton v-for="i in 6" :key="i" class="h-32 w-full" />
    </div>

    <div v-else-if="store.error" class="rounded-lg border border-red-200 bg-red-50 p-8 text-center dark:border-red-800 dark:bg-red-950">
      <UIcon name="i-lucide-alert-circle" class="mx-auto mb-2 h-8 w-8 text-red-500" />
      <p class="text-red-700 dark:text-red-300">{{ store.error }}</p>
      <UButton class="mt-4" variant="soft" @click="store.fetchActivities()">Coba Lagi</UButton>
    </div>

    <div v-else-if="store.activities.length === 0" class="rounded-lg border border-gray-200 bg-white p-10 text-center dark:border-gray-700/50 dark:bg-gray-900">
      <UIcon name="i-lucide-inbox" class="mx-auto mb-3 h-12 w-12 text-gray-300 dark:text-gray-600" />
      <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Belum Ada Kegiatan Wajib</h2>
      <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">Tidak ada kegiatan yang ditetapkan untuk program Anda di periode ini.</p>
    </div>

    <div v-else class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <div
        v-for="act in store.activities"
        :key="act.id"
        class="cursor-pointer rounded-lg border border-gray-200 bg-white p-5 transition hover:shadow-md dark:border-gray-700/50 dark:bg-gray-900"
        @click="router.push(`/akademik/jadwal?activity_period_id=${act.activity_period_id}`)"
      >
        <div class="flex items-start justify-between gap-3">
          <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-teal-50 dark:bg-teal-950">
            <UIcon name="i-lucide-flame" class="h-5 w-5 text-teal-600 dark:text-teal-400" />
          </div>
          <UBadge color="neutral" variant="subtle" size="xs">{{ act.schedule_count }} jadwal</UBadge>
        </div>
        <h3 class="mt-3 text-base font-semibold text-gray-900 dark:text-gray-100">{{ act.activity_name }}</h3>
        <p class="mt-0.5 text-xs font-medium uppercase tracking-wide text-gray-400">{{ act.activity_code }}</p>
        <div class="mt-4 flex items-center gap-1 text-sm text-teal-600 dark:text-teal-400">
          Lihat jadwal
          <UIcon name="i-lucide-chevron-right" class="h-4 w-4" />
        </div>
      </div>
    </div>
  </div>
</template>
