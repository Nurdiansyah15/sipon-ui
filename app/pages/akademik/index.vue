<script setup lang="ts">
import { useAkademikSantriStore } from '~/stores/akademik-santri'
import { parseApiError, getErrorStatus } from '~/utils/errorParser'
import {
  formatDate,
  formatTimeRange,
  scheduleRecurrenceLabel,
  schedulesForToday,
  scheduleTypeLabel,
} from '~/utils/akademikSchedule'

definePageMeta({ layout: 'default' })

const store = useAkademikSantriStore()
const router = useRouter()
const toast = useToast()

const notSantri = ref(false)
const applying = ref(false)

const herregistrasiStatus = computed(() => store.herregistrasi?.status ?? 'none')

const herregMeta = computed<{ label: string; color: 'success' | 'warning' | 'error' | 'neutral' }>(() => {
  switch (herregistrasiStatus.value) {
    case 'completed':
      return { label: 'Sudah herregistrasi', color: 'success' }
    case 'pending':
      return { label: 'Menunggu konfirmasi', color: 'warning' }
    case 'cancelled':
      return { label: 'Dibatalkan', color: 'error' }
    default:
      return { label: 'Belum herregistrasi', color: 'neutral' }
  }
})

const canApply = computed(() => herregistrasiStatus.value === 'none' || herregistrasiStatus.value === 'cancelled')

const kegiatanPreview = computed(() => store.activities.slice(0, 5))
const todaySchedules = computed(() => schedulesForToday(store.schedules))

async function loadAll() {
  try {
    await store.fetchSummary()
  } catch (err) {
    if (getErrorStatus(err) === 404) {
      notSantri.value = true
    } else {
      toast.add({ title: 'Gagal memuat data', description: parseApiError(err), color: 'error' })
    }
  }
  try {
    await Promise.all([store.fetchActivities(), store.fetchSchedules()])
  } catch (err) {
    toast.add({ title: 'Gagal memuat data', description: parseApiError(err), color: 'error' })
  }
}

async function handleApplyHerreg() {
  applying.value = true
  try {
    await store.applyHerregistrasi()
    toast.add({ title: 'Herregistrasi berhasil diajukan', color: 'success' })
    await store.fetchSummary()
  } catch (err) {
    toast.add({ title: 'Gagal mengajukan herregistrasi', description: parseApiError(err), color: 'error' })
  } finally {
    applying.value = false
  }
}

onMounted(loadAll)
</script>

<template>
  <div class="mx-auto max-w-7xl px-4 py-8">
    <div class="mb-8 flex items-start justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Akademik</h1>
        <p class="mt-1 text-sm text-gray-500">Periode akademik, herregistrasi, program, dan kegiatan wajib Anda.</p>
      </div>
      <UButton color="neutral" variant="ghost" icon="i-lucide-arrow-left" size="sm" class="shrink-0" @click="router.push('/')">Kembali</UButton>
    </div>

    <!-- Not a santri -->
    <div v-if="notSantri" class="rounded-lg border border-gray-200 bg-white p-10 text-center dark:border-gray-700/50 dark:bg-gray-900">
      <UIcon name="i-lucide-graduation-cap" class="mx-auto mb-3 h-12 w-12 text-gray-300 dark:text-gray-600" />
      <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Bukan Profil Santri</h2>
      <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">Akun Anda belum terdaftar sebagai santri di sistem ini.</p>
    </div>

    <!-- Loading -->
    <div v-else-if="store.isLoading && !store.summary" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <USkeleton v-for="i in 3" :key="i" class="h-28 w-full" />
    </div>

    <template v-else>
      <!-- Summary cards -->
      <div class="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div class="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700/50 dark:bg-gray-900">
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-calendar-range" class="h-5 w-5 text-teal-600 dark:text-teal-400" />
            <p class="text-sm font-medium text-gray-500">Periode Aktif</p>
          </div>
          <template v-if="store.activePeriod">
            <p class="mt-2 text-lg font-bold text-gray-900 dark:text-gray-100">{{ store.activePeriod.name }}</p>
            <p class="mt-1 text-sm text-gray-500">
              {{ formatDate(store.activePeriod.start_date) }} — {{ formatDate(store.activePeriod.end_date) }}
            </p>
          </template>
          <p v-else class="mt-2 text-sm text-gray-500">Tidak ada periode aktif saat ini.</p>
        </div>

        <div class="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700/50 dark:bg-gray-900">
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-clipboard-check" class="h-5 w-5 text-teal-600 dark:text-teal-400" />
            <p class="text-sm font-medium text-gray-500">Herregistrasi</p>
          </div>
          <div class="mt-2">
            <UBadge :color="herregMeta.color" variant="subtle">{{ herregMeta.label }}</UBadge>
          </div>
          <UButton
            v-if="store.hasActivePeriod && canApply"
            class="mt-3"
            size="sm"
            :loading="applying || store.isSubmitting"
            :disabled="!store.hasActivePeriod"
            icon="i-lucide-file-plus"
            @click="handleApplyHerreg"
          >
            Ajukan Herregistrasi
          </UButton>
        </div>

        <div class="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700/50 dark:bg-gray-900">
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-book-open" class="h-5 w-5 text-teal-600 dark:text-teal-400" />
            <p class="text-sm font-medium text-gray-500">Program</p>
          </div>
          <template v-if="store.program">
            <div class="mt-2 flex items-center gap-2">
              <UBadge color="primary" variant="soft">{{ store.program.code }}</UBadge>
              <p class="text-lg font-bold text-gray-900 dark:text-gray-100">{{ store.program.name }}</p>
            </div>
          </template>
          <p v-else class="mt-2 text-sm text-gray-500">Belum terdaftar di program manapun.</p>
        </div>
      </div>

      <div class="grid gap-6 lg:grid-cols-2">
        <!-- Kegiatan wajib -->
        <div class="rounded-lg border border-gray-200 bg-white dark:border-gray-700/50 dark:bg-gray-900">
          <div class="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700/50">
            <h2 class="font-semibold text-gray-900 dark:text-gray-100">Kegiatan Wajib</h2>
            <NuxtLink v-if="store.activities.length > 0" to="/akademik/kegiatan" class="text-sm text-teal-600 hover:underline dark:text-teal-400">
              Lihat semua ({{ store.activities.length }})
            </NuxtLink>
          </div>
          <div class="p-6">
            <div v-if="store.isLoading" class="space-y-3">
              <USkeleton v-for="i in 3" :key="i" class="h-12 w-full" />
            </div>
            <div v-else-if="store.activities.length === 0" class="py-6 text-center">
              <UIcon name="i-lucide-inbox" class="mx-auto mb-2 h-8 w-8 text-gray-300 dark:text-gray-600" />
              <p class="text-sm text-gray-500">Belum ada kegiatan wajib di periode ini.</p>
            </div>
            <ul v-else class="space-y-2">
              <li
                v-for="act in kegiatanPreview"
                :key="act.id"
                class="flex items-center gap-3 rounded-lg border border-gray-100 px-3 py-2.5 dark:border-gray-700/50"
              >
                <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal-50 dark:bg-teal-950">
                  <UIcon name="i-lucide-flame" class="h-4 w-4 text-teal-600 dark:text-teal-400" />
                </div>
                <div class="min-w-0 flex-1">
                  <p class="truncate text-sm font-medium text-gray-900 dark:text-gray-100">{{ act.activity_name }}</p>
                  <p class="text-xs text-gray-500">{{ act.schedule_count }} jadwal</p>
                </div>
              </li>
            </ul>
          </div>
        </div>

        <!-- Jadwal hari ini -->
        <div class="rounded-lg border border-gray-200 bg-white dark:border-gray-700/50 dark:bg-gray-900">
          <div class="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700/50">
            <h2 class="font-semibold text-gray-900 dark:text-gray-100">Jadwal Hari Ini</h2>
            <NuxtLink v-if="store.schedules.length > 0" to="/akademik/jadwal" class="text-sm text-teal-600 hover:underline dark:text-teal-400">
              Lihat semua
            </NuxtLink>
          </div>
          <div class="p-6">
            <div v-if="store.isLoading" class="space-y-3">
              <USkeleton v-for="i in 3" :key="i" class="h-12 w-full" />
            </div>
            <div v-else-if="todaySchedules.length === 0" class="py-6 text-center">
              <UIcon name="i-lucide-calendar-off" class="mx-auto mb-2 h-8 w-8 text-gray-300 dark:text-gray-600" />
              <p class="text-sm text-gray-500">Tidak ada jadwal untuk hari ini.</p>
            </div>
            <ul v-else class="space-y-2">
              <li
                v-for="sched in todaySchedules"
                :key="sched.id"
                class="flex items-center gap-3 rounded-lg border border-gray-100 px-3 py-2.5 dark:border-gray-700/50"
              >
                <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal-50 dark:bg-teal-950">
                  <UIcon name="i-lucide-clock" class="h-4 w-4 text-teal-600 dark:text-teal-400" />
                </div>
                <div class="min-w-0 flex-1">
                  <p class="truncate text-sm font-medium text-gray-900 dark:text-gray-100">{{ sched.activity_name }}</p>
                  <p class="text-xs text-gray-500">{{ formatTimeRange(sched.start_time, sched.end_time) }}</p>
                </div>
                <UBadge color="neutral" variant="subtle" size="xs">{{ scheduleTypeLabel(sched.type) }}</UBadge>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
