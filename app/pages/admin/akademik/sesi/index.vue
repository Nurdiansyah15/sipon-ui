<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import { useAkademikStore } from '~/stores/akademik'
import { usePermission } from '~/composables/usePermission'
import type { ActivitySession } from '#shared/types/Akademik'

definePageMeta({ layout: 'akademik' })

const route = useRoute()
const store = useAkademikStore()
const toast = useToast()
const { can } = usePermission()

const page = ref(1)
const limit = ref(10)
const periodFilter = ref<string>('all')
const scheduleFilter = ref<string | undefined>(undefined)
const statusFilter = ref<string>('all')

// Deep-link dari halaman detail jadwal: ?activity_schedule_id=xxx
const scheduleParam = route.query.activity_schedule_id as string | undefined
if (scheduleParam) scheduleFilter.value = scheduleParam

watch([page, limit, periodFilter, scheduleFilter, statusFilter], () => load())

async function load() {
  try {
    await store.fetchSessions({
      page: page.value,
      limit: limit.value,
      academic_period_id: periodFilter.value === 'all' ? undefined : periodFilter.value,
      activity_schedule_id: scheduleFilter.value,
      status: statusFilter.value === 'all' ? undefined : statusFilter.value as any,
    })
  } catch {
    // error in store
  }
}

async function loadOptions() {
  if (store.periods.length === 0) {
    try { await store.fetchPeriods({ limit: 100 }) } catch { /* ignore */ }
  }
}

onMounted(() => {
  load()
  loadOptions()
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

const periodOptions = computed(() => [
  { label: 'Semua Periode', value: 'all' },
  ...store.periods.map(p => ({ label: `${p.code} — ${p.name}`, value: p.id })),
])

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
  <div class="mx-auto max-w-7xl px-4 py-8">
    <div class="mb-6 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Sesi Kegiatan</h1>
        <p class="mt-1 text-sm text-gray-700 dark:text-gray-300">Kejadian konkret dari jadwal kegiatan dan absensinya.</p>
      </div>
      <UButton
        v-if="can('manage_akademik')"
        icon="i-lucide-plus"
        class="bg-teal-600 text-white hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-400"
        @click="openCreate"
      >
        Buat Sesi
      </UButton>
    </div>

    <div class="mb-4 flex flex-wrap gap-3">
      <USelect v-model="periodFilter" :items="periodOptions" size="sm" class="w-64" />
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

    <AdminAkademikSessionFormModal
      v-model:open="formOpen"
      @success="onSessionCreated"
    />
  </div>
</template>
