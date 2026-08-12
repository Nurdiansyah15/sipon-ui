<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { ApiSuccess } from '#shared/types/ApiResponse'
import { useAkademikStore } from '~/stores/akademik'
import { usePermission } from '~/composables/usePermission'
import { useAkademikPeriodContext } from '~/composables/useAkademikPeriodContext'
import type { ActivitySchedule, ActivityPeriod, ActivitySession } from '#shared/types/Akademik'

definePageMeta({ layout: 'akademik' })

const route = useRoute()
const store = useAkademikStore()
const toast = useToast()
const { can } = usePermission()
const { selectedPeriodId, loadPeriods } = useAkademikPeriodContext()

const page = ref(1)
const limit = ref(10)
const scheduleFilter = ref<string | undefined>(undefined)
const statusFilter = ref<string>('all')

// Deep-link dari halaman detail jadwal: ?activity_schedule_id=xxx
const scheduleParam = route.query.activity_schedule_id as string | undefined
if (scheduleParam) scheduleFilter.value = scheduleParam

// Opsi filter jadwal (semua jadwal pada periode terpilih).
const scheduleOptionsData = ref<ActivitySchedule[]>([])

async function loadScheduleOptions() {
  if (!selectedPeriodId.value) return
  try {
    const api = useApi()
    const apRes = await api.get<ApiSuccess<ActivityPeriod[]>>('/api/v1/web/akademik/activity-periods', {
      query: { page: 1, limit: 100, academic_period_id: selectedPeriodId.value },
    })
    const all: ActivitySchedule[] = []
    for (const p of apRes.data) {
      const r = await api.get<ApiSuccess<ActivitySchedule[]>>(`/api/v1/web/akademik/activity-periods/${p.id}/schedules`)
      all.push(...r.data)
    }
    scheduleOptionsData.value = all
  } catch {
    scheduleOptionsData.value = []
  }
}

const scheduleOptions = computed(() =>
  scheduleOptionsData.value.map((s) => ({
    label: `${s.activity_name ?? s.activity_code ?? 'Jadwal'} — ${s.type} (${s.start_time?.slice(0, 5) ?? ''})`,
    value: s.id,
  })),
)

watch([page, limit, selectedPeriodId, scheduleFilter, statusFilter], () => load())

async function load() {
  if (!selectedPeriodId.value) return
  try {
    await store.fetchSessions({
      page: page.value,
      limit: limit.value,
      academic_period_id: selectedPeriodId.value,
      activity_schedule_id: scheduleFilter.value,
      status: statusFilter.value === 'all' ? undefined : statusFilter.value as any,
    })
  } catch {
    // error in store
  }
}

watch(selectedPeriodId, () => {
  scheduleFilter.value = undefined
  page.value = 1
  loadScheduleOptions()
})

onMounted(() => {
  loadPeriods()
  loadScheduleOptions()
  load()
})

const totalPages = computed(() => store.sessionsMeta?.total_pages ?? 1)
const totalItems = computed(() => store.sessionsMeta?.total ?? 0)

const columns: TableColumn<ActivitySession>[] = [
  { accessorKey: 'activity_name', header: 'Kegiatan' },
  { accessorKey: 'schedule_type', header: 'Tipe' },
  { accessorKey: 'starts_at', header: 'Mulai' },
  { accessorKey: 'ends_at', header: 'Selesai' },
  { accessorKey: 'status', header: 'Status' },
]

const statusOptions = [
  { label: 'Semua Status', value: 'all' },
  { label: 'Terjadwal', value: 'scheduled' },
  { label: 'Berlangsung', value: 'open' },
  { label: 'Selesai', value: 'completed' },
  { label: 'Dibatalkan', value: 'cancelled' },
]

function fmtDateTime(v: string) {
  return new Date(v).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const formOpen = ref(false)

function openCreate() {
  formOpen.value = true
}

// Saat dibuka dari halaman jadwal (?activity_schedule_id=xxx), jadwal terkait
// di-pass agar waktu otomatis terisi dari jadwal.
const prefillSchedule = computed(() => {
  if (!scheduleFilter.value) return null
  return scheduleOptionsData.value.find(s => s.id === scheduleFilter.value) ?? null
})

function onSessionCreated() {
  formOpen.value = false
  load()
}

function openDetail(row: ActivitySession) {
  navigateTo(`/admin/akademik/sesi/${row.id}`)
}

function handleRowSelect(_e: any, row: any) {
  openDetail(row.original as ActivitySession)
}
</script>

<template>
  <AkademikPeriodGuard v-if="!selectedPeriodId" />
  <template v-else>
    <div class="mx-auto max-w-7xl px-4 py-8">
      <div class="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Sesi Kegiatan</h1>
          <p class="mt-1 text-sm text-gray-700 dark:text-gray-300">Kejadian konkret dari jadwal kegiatan dan absensinya.</p>
        </div>
        <div class="flex items-center gap-2">
          <UButton
            to="/admin/akademik/operasional"
            icon="i-lucide-arrow-left"
            color="neutral"
            variant="outline"
          >
            Kembali
          </UButton>
          <UButton
            v-if="can('manage_akademik')"
            icon="i-lucide-plus"
            class="bg-teal-600 text-white hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-400"
            @click="openCreate"
          >
            Buat Sesi
          </UButton>
        </div>
      </div>

      <div class="mb-4 flex flex-wrap gap-3">
        <USelect
          v-model="scheduleFilter"
          :items="scheduleOptions"
          placeholder="Semua jadwal"
          clearable
          searchable
          size="sm"
          class="w-60"
        />
        <USelect v-model="statusFilter" :items="statusOptions" size="sm" class="w-40" />
      </div>

      <div class="overflow-x-auto rounded-lg border border-gray-200 bg-white dark:border-gray-700/50 dark:bg-gray-900">
        <UTable
          :data="store.sessions"
          :columns="columns"
          :loading="store.isLoading"
          class="w-full"
          :ui="{ th: 'text-gray-900 font-bold dark:text-gray-100' }"
          :on-select="handleRowSelect"
        >
          <template #schedule_type-cell="{ row }">
            <AkademikScheduleTypeBadge :type="row.original.schedule_type ?? 'once'" size="xs" />
          </template>

          <template #starts_at-cell="{ row }">
            <span class="text-sm text-gray-700 dark:text-gray-300">{{ fmtDateTime(row.original.starts_at) }}</span>
          </template>

          <template #ends_at-cell="{ row }">
            <span class="text-sm text-gray-700 dark:text-gray-300">{{ fmtDateTime(row.original.ends_at) }}</span>
          </template>

          <template #status-cell="{ row }">
            <AkademikStatusBadge :status="row.original.status" type="session" size="sm" />
          </template>
        </UTable>
      </div>

      <div class="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p class="text-sm text-gray-700 dark:text-gray-300">
          Total {{ totalItems }} sesi · hal. {{ page }} / {{ totalPages }}
        </p>
        <UPagination
          v-model:page="page"
          :total="totalItems"
          :items-per-page="limit"
          :sibling-count="1"
          show-edges
        >
          <template #item="{ item, page: curPage }">
            <UButton
              v-if="item.type === 'page'"
              :color="curPage === item.value ? 'primary' : 'neutral'"
              :variant="curPage === item.value ? 'solid' : 'outline'"
              :label="String(item.value)"
              size="sm"
            />
          </template>
        </UPagination>
      </div>
    </div>
  </template>

  <AdminAkademikSessionFormModal
    v-model:open="formOpen"
    :schedule="prefillSchedule"
    @success="onSessionCreated"
  />
</template>
