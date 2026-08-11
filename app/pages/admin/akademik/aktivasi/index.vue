<script setup lang="ts">
import type { TableColumn, DropdownMenuItem } from '@nuxt/ui'
import { useAkademikStore } from '~/stores/akademik'
import { usePermission } from '~/composables/usePermission'
import type { ActivityPeriod } from '#shared/types/Akademik'

definePageMeta({ layout: 'akademik' })

const store = useAkademikStore()
const toast = useToast()
const { can } = usePermission()

const page = ref(1)
const limit = ref(10)
const periodFilter = ref<string>('all')
const statusFilter = ref<string>('all')

watch([page, limit, periodFilter, statusFilter], () => load())

async function load() {
  try {
    await store.fetchActivityPeriods({
      page: page.value,
      limit: limit.value,
      academic_period_id: periodFilter.value === 'all' ? undefined : periodFilter.value,
      status: statusFilter.value === 'all' ? undefined : statusFilter.value as any,
    })
  } catch {
    // error in store
  }
}

async function loadPeriods() {
  if (store.periods.length === 0) {
    try { await store.fetchPeriods({ limit: 100 }) } catch { /* ignore */ }
  }
}

onMounted(() => {
  load()
  loadPeriods()
})

const totalPages = computed(() => store.activityPeriodsMeta?.total_pages ?? 1)
const totalItems = computed(() => store.activityPeriodsMeta?.total ?? 0)

const columns: TableColumn<ActivityPeriod>[] = [
  { accessorKey: 'activity_code', header: 'Kode' },
  { accessorKey: 'activity_name', header: 'Kegiatan' },
  { accessorKey: 'period_name', header: 'Periode' },
  { accessorKey: 'status', header: 'Status' },
  { id: 'actions', header: '' },
]

const formOpen = ref(false)

const periodOptions = computed(() => [
  { label: 'Semua Periode', value: 'all' },
  ...store.periods.map(p => ({ label: `${p.code} — ${p.name}`, value: p.id })),
])

const statusOptions = [
  { label: 'Semua Status', value: 'all' },
  { label: 'Aktif', value: 'active' },
  { label: 'Nonaktif', value: 'inactive' },
]

const confirmOpen = ref(false)
const confirmTitle = ref('')
const confirmMessage = ref('')
const confirmAction = ref<'activate' | 'deactivate'>('activate')
const confirmRunning = ref(false)
const selected = ref<ActivityPeriod | null>(null)

function activatePeriod(row: ActivityPeriod) {
  selected.value = row
  confirmAction.value = 'activate'
  confirmTitle.value = 'Aktifkan Kegiatan'
  confirmMessage.value = `Aktifkan '${row.activity_name}' pada periode '${row.period_name}'?`
  confirmOpen.value = true
}

function deactivatePeriod(row: ActivityPeriod) {
  selected.value = row
  confirmAction.value = 'deactivate'
  confirmTitle.value = 'Nonaktifkan Kegiatan'
  confirmMessage.value = `Nonaktifkan '${row.activity_name}' pada periode '${row.period_name}'?`
  confirmOpen.value = true
}

async function confirmTransition() {
  if (!selected.value) return
  confirmRunning.value = true
  try {
    if (confirmAction.value === 'activate') {
      await store.activateActivityPeriod(selected.value.id)
      toast.add({ title: 'Kegiatan diaktifkan', color: 'success' })
    } else {
      await store.deactivateActivityPeriod(selected.value.id)
      toast.add({ title: 'Kegiatan dinonaktifkan', color: 'success' })
    }
    confirmOpen.value = false
    await load()
  } catch {
    toast.add({ title: store.error ?? 'Gagal mengubah status', color: 'error' })
  } finally {
    confirmRunning.value = false
  }
}

function rowActions(row: ActivityPeriod): DropdownMenuItem[] {
  const items: DropdownMenuItem[] = []
  items.push({
    label: 'Kelola',
    icon: 'i-lucide-arrow-right',
    onSelect: () => navigateTo(`/admin/akademik/aktivasi/${row.id}`),
  })
  items.push({ type: 'separator' })
  if (row.status === 'active') {
    items.push({ label: 'Nonaktifkan', icon: 'i-lucide-pause', onSelect: () => deactivatePeriod(row) })
  } else {
    items.push({ label: 'Aktifkan', icon: 'i-lucide-play', onSelect: () => activatePeriod(row) })
  }
  return items
}
</script>

<template>
  <div class="mx-auto max-w-7xl px-4 py-8">
    <div class="mb-6 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Aktivasi Kegiatan</h1>
        <p class="mt-1 text-sm text-gray-700 dark:text-gray-300">Tentukan kegiatan apa saja yang aktif pada tiap periode akademik.</p>
      </div>
      <UButton
        v-if="can('manage_akademik')"
        icon="i-lucide-plus"
        class="bg-teal-600 text-white hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-400"
        @click="formOpen = true"
      >
        Aktivasi Kegiatan
      </UButton>
    </div>

    <div class="mb-4 flex flex-wrap gap-3">
      <USelect v-model="periodFilter" :items="periodOptions" size="sm" class="w-64" />
      <USelect v-model="statusFilter" :items="statusOptions" size="sm" class="w-40" />
    </div>

    <div class="overflow-x-auto rounded-lg border border-gray-200 bg-white dark:border-gray-700/50 dark:bg-gray-900">
      <UTable
        :data="store.activityPeriods"
        :columns="columns"
        :loading="store.isLoading"
        class="w-full"
        :ui="{ th: 'text-gray-900 font-bold dark:text-gray-100' }"
      >
        <template #activity_code-cell="{ row }">
          <span class="font-mono text-sm font-medium text-gray-900 dark:text-gray-100">{{ row.original.activity_code }}</span>
        </template>

        <template #status-cell="{ row }">
          <AkademikStatusBadge :status="row.original.status" type="activity_period" size="sm" />
        </template>

        <template #actions-cell="{ row }">
          <AppRowActions v-if="can('manage_akademik')" :items="rowActions(row.original)" />
        </template>
      </UTable>
    </div>

    <div class="mt-4 flex flex-wrap items-center justify-between gap-3">
      <p class="text-sm text-gray-700 dark:text-gray-300">
        Total {{ totalItems }} aktivasi · hal. {{ page }} / {{ totalPages }}
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

    <AdminAkademikActivityPeriodFormModal
      v-model:open="formOpen"
      @success="load"
    />

    <AdminConfirmActionModal
      :open="confirmOpen"
      :title="confirmTitle"
      :message="confirmMessage"
      confirm-label="Ya, Lanjutkan"
      :loading="confirmRunning"
      @update:open="confirmOpen = $event"
      @confirm="confirmTransition"
    />
  </div>
</template>
