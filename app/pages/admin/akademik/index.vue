<script setup lang="ts">
import { useAkademikStore } from '~/stores/akademik'
import { usePermission } from '~/composables/usePermission'

definePageMeta({ layout: 'akademik' })

const store = useAkademikStore()
const { can } = usePermission()
const toast = useToast()

const loading = ref(true)
const totalPrograms = ref(0)
const totalPeriods = ref(0)
const totalActivities = ref(0)
const totalRegistrations = ref(0)

onMounted(async () => {
  loading.value = true
  try {
    await Promise.all([
      store.fetchPrograms({ limit: 1 }),
      store.fetchPeriods({ limit: 1 }),
      store.fetchActivities({ limit: 1 }),
      store.fetchRegistrations({ limit: 1 }),
    ])
    totalPrograms.value = store.programsMeta?.total ?? 0
    totalPeriods.value = store.periodsMeta?.total ?? 0
    totalActivities.value = store.activitiesMeta?.total ?? 0
    totalRegistrations.value = store.registrationsMeta?.total ?? 0
  } catch {
    toast.add({ title: 'Gagal memuat ringkasan data', color: 'error' })
  } finally {
    loading.value = false
  }
})

const cards = [
  { label: 'Program', key: 'programs', icon: 'i-lucide-graduation-cap', color: 'text-teal-600 dark:text-teal-400', bg: 'bg-teal-50 dark:bg-teal-950' },
  { label: 'Periode Akademik', key: 'periods', icon: 'i-lucide-calendar-range', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950' },
  { label: 'Kegiatan', key: 'activities', icon: 'i-lucide-trophy', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950' },
  { label: 'Herregistrasi', key: 'registrations', icon: 'i-lucide-clipboard-check', color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-950' },
]

function cardValue(key: string) {
  switch (key) {
    case 'programs': return totalPrograms.value.toLocaleString('id-ID')
    case 'periods': return totalPeriods.value.toLocaleString('id-ID')
    case 'activities': return totalActivities.value.toLocaleString('id-ID')
    case 'registrations': return totalRegistrations.value.toLocaleString('id-ID')
    default: return '0'
  }
}
</script>

<template>
  <div class="mx-auto max-w-7xl px-4 py-8">
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Akademik</h1>
      <p class="mt-1 text-sm text-gray-700 dark:text-gray-300">
        Kelola program, periode akademik, kegiatan, jadwal, sesi, dan absensi santri.
      </p>
    </div>

    <div v-if="loading" class="flex justify-center py-16">
      <UIcon name="i-lucide-loader-circle" class="h-8 w-8 animate-spin text-teal-600" />
    </div>

    <template v-else>
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div
          v-for="card in cards"
          :key="card.key"
          class="flex items-center gap-4 rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-700/50 dark:bg-gray-900"
        >
          <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg" :class="card.bg">
            <UIcon :name="card.icon" class="h-6 w-6" :class="card.color" />
          </div>
          <div class="min-w-0 flex-1">
            <p class="text-sm text-gray-500 dark:text-gray-400">{{ card.label }}</p>
            <p class="text-xl font-bold text-gray-900 dark:text-gray-100">{{ cardValue(card.key) }}</p>
          </div>
        </div>
      </div>

      <div class="mt-8">
        <h2 class="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">Modul Akademik</h2>
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <FeatureModuleCard
            v-if="can('manage_akademik')"
            title="Program"
            description="Master program pendidikan pesantren (Tahfidz, Kitab, dan lainnya)."
            icon="i-lucide-graduation-cap"
            to="/admin/akademik/program"
          />
          <FeatureModuleCard
            v-if="can('manage_akademik')"
            title="Periode Akademik"
            description="Kelola periode akademik dan siklus hidupnya (draft → open → closed)."
            icon="i-lucide-calendar-range"
            to="/admin/akademik/periode"
          />
          <FeatureModuleCard
            v-if="can('manage_akademik')"
            title="Kegiatan"
            description="Master kegiatan pesantren: shalat berjamaah, kajian, setoran hafalan, dll."
            icon="i-lucide-trophy"
            to="/admin/akademik/kegiatan"
          />
          <FeatureModuleCard
            v-if="can('manage_akademik')"
            title="Herregistrasi"
            description="Registrasi administratif santri pada periode akademik."
            icon="i-lucide-clipboard-check"
            to="/admin/akademik/herregistrasi"
          />
          <FeatureModuleCard
            v-if="can('manage_akademik')"
            title="Aktivasi Kegiatan"
            description="Tentukan kegiatan apa yang aktif pada tiap periode beserta scope programnya."
            icon="i-lucide-power"
            to="/admin/akademik/aktivasi"
          />
          <FeatureModuleCard
            v-if="can('manage_akademik')"
            title="Sesi & Absensi"
            description="Kejadian konkret kegiatan dan pencatatan kehadiran santri."
            icon="i-lucide-users"
            to="/admin/akademik/sesi"
          />
        </div>
      </div>
    </template>
  </div>
</template>
