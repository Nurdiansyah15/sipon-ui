<script setup lang="ts">
import type { ApiSuccess } from '#shared/types/ApiResponse'
import type { ActivityPeriod, ActivitySchedule, ActivitySession, SantriRegistration } from '#shared/types/Akademik'
import { useAkademikPeriodContext } from '~/composables/useAkademikPeriodContext'
import { useAkademikStore } from '~/stores/akademik'

definePageMeta({ layout: 'akademik' })

const store = useAkademikStore()
const { selectedPeriodId, selectedPeriod, setPeriod, loadPeriods } = useAkademikPeriodContext()

const loadingCounts = ref(false)
const counts = ref({
  registrations: 0,
  activityPeriods: 0,
  schedules: 0,
  sessions: 0,
})

const periodOptions = computed(() =>
  store.periods.map(p => ({ label: `${p.code} — ${p.name}`, value: p.id })),
)

const cards = computed(() => [
  {
    label: 'Herregistrasi',
    description: 'Registrasi administratif santri pada periode ini.',
    icon: 'i-lucide-clipboard-check',
    count: counts.value.registrations,
    countLabel: 'registrasi',
    to: '/admin/akademik/herregistrasi',
  },
  {
    label: 'Aktivasi Kegiatan',
    description: 'Kegiatan yang aktif pada periode ini.',
    icon: 'i-lucide-power',
    count: counts.value.activityPeriods,
    countLabel: 'aktivasi',
    to: '/admin/akademik/aktivasi',
  },
  {
    label: 'Jadwal',
    description: 'Pola pelaksanaan kegiatan periode ini.',
    icon: 'i-lucide-calendar-clock',
    count: counts.value.schedules,
    countLabel: 'jadwal',
    to: '/admin/akademik/jadwal',
  },
  {
    label: 'Sesi & Absensi',
    description: 'Kejadian konkret kegiatan dan pencatatan kehadiran.',
    icon: 'i-lucide-users',
    count: counts.value.sessions,
    countLabel: 'sesi',
    to: '/admin/akademik/sesi',
  },
])

async function loadCounts(periodId: string) {
  loadingCounts.value = true
  try {
    const api = useApi()
    const [regRes, apRes, sesRes] = await Promise.all([
      api.get<ApiSuccess<SantriRegistration[]>>('/api/v1/web/akademik/registrations', {
        query: { page: 1, limit: 1, academic_period_id: periodId },
      }),
      api.get<ApiSuccess<ActivityPeriod[]>>('/api/v1/web/akademik/activity-periods', {
        query: { page: 1, limit: 100, academic_period_id: periodId },
      }),
      api.get<ApiSuccess<ActivitySession[]>>('/api/v1/web/akademik/sessions', {
        query: { page: 1, limit: 1, academic_period_id: periodId },
      }),
    ])

    let scheduleTotal = 0
    for (const p of apRes.data) {
      const r = await api.get<ApiSuccess<ActivitySchedule[]>>(`/api/v1/web/akademik/activity-periods/${p.id}/schedules`)
      scheduleTotal += r.data.length
    }

    counts.value = {
      registrations: regRes.meta?.total ?? 0,
      activityPeriods: apRes.meta?.total ?? 0,
      schedules: scheduleTotal,
      sessions: sesRes.meta?.total ?? 0,
    }
  } catch {
    counts.value = { registrations: 0, activityPeriods: 0, schedules: 0, sessions: 0 }
  } finally {
    loadingCounts.value = false
  }
}

watch(selectedPeriodId, (id) => {
  if (id) loadCounts(id)
})

onMounted(async () => {
  await loadPeriods()
  if (selectedPeriodId.value) loadCounts(selectedPeriodId.value)
})

function onPick(id: string) {
  setPeriod(id)
}
</script>

<template>
  <div class="mx-auto max-w-7xl px-4 py-8">
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Ruang Kerja Operasional</h1>
      <p class="mt-1 text-sm text-gray-700 dark:text-gray-300">
        Pilih periode akademik untuk mulai bekerja. Semua proses operasional akan otomatis difilter ke periode ini.
      </p>
    </div>

    <div class="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700/50 dark:bg-gray-900">
      <label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Periode Kerja</label>

      <div v-if="store.periods.length === 0" class="flex items-center justify-between gap-3 rounded-lg border border-dashed border-gray-300 p-4 dark:border-gray-600">
        <p class="text-sm text-gray-500 dark:text-gray-400">Belum ada periode akademik. Buat periode terlebih dahulu di Master › Periode Akademik.</p>
        <UButton variant="outline" size="sm" color="primary" to="/admin/akademik/periode">Buat Periode</UButton>
      </div>

      <USelect
        v-else
        :model-value="selectedPeriodId ?? ''"
        :items="periodOptions"
        placeholder="Pilih periode akademik..."
        searchable
        class="w-full max-w-xl"
        size="lg"
        @update:model-value="onPick($event as string)"
      />

      <p v-if="selectedPeriod" class="mt-3 text-sm text-teal-600 dark:text-teal-400">
        Periode aktif: <span class="font-semibold">{{ selectedPeriod.code }} — {{ selectedPeriod.name }}</span>
      </p>
    </div>

    <div v-if="selectedPeriodId" class="mt-8">
      <div v-if="loadingCounts" class="flex justify-center py-16">
        <UIcon name="i-lucide-loader-circle" class="h-8 w-8 animate-spin text-teal-600" />
      </div>

      <div v-else class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <NuxtLink
          v-for="card in cards"
          :key="card.to"
          :to="card.to"
          class="group flex flex-col justify-between gap-4 rounded-lg border border-gray-200 bg-white p-5 transition hover:shadow-md dark:border-gray-700/50 dark:bg-gray-900"
        >
          <div class="flex items-start justify-between">
            <div class="flex h-12 w-12 items-center justify-center rounded-lg bg-teal-50 dark:bg-teal-950">
              <UIcon :name="card.icon" class="h-6 w-6 text-teal-600 dark:text-teal-400" />
            </div>
            <UIcon name="i-lucide-arrow-right" class="h-4 w-4 text-gray-400 transition group-hover:translate-x-0.5 group-hover:text-teal-600 dark:text-gray-500" />
          </div>
          <div>
            <p class="text-2xl font-bold text-gray-900 dark:text-gray-100">{{ card.count.toLocaleString('id-ID') }}</p>
            <p class="text-xs text-gray-500 dark:text-gray-400">{{ card.countLabel }}</p>
            <h3 class="mt-2 font-semibold text-gray-900 dark:text-gray-100">{{ card.label }}</h3>
            <p class="mt-0.5 line-clamp-2 text-sm text-gray-500 dark:text-gray-400">{{ card.description }}</p>
          </div>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>
