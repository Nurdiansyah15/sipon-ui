<script setup lang="ts">
import type { TableColumn, DropdownMenuItem } from '@nuxt/ui'
import { useAkademikStore } from '~/stores/akademik'
import { usePermission } from '~/composables/usePermission'
import type { SantriRegistration } from '#shared/types/Akademik'

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
    await store.fetchRegistrations({
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

const totalPages = computed(() => store.registrationsMeta?.total_pages ?? 1)
const totalItems = computed(() => store.registrationsMeta?.total ?? 0)

const columns: TableColumn<SantriRegistration>[] = [
  { accessorKey: 'santri_nis', header: 'NIS' },
  { accessorKey: 'santri_id', header: 'Santri' },
  { accessorKey: 'period_name', header: 'Periode' },
  { accessorKey: 'status', header: 'Status' },
  { accessorKey: 'registered_at', header: 'Tercatat' },
  { id: 'actions', header: '' },
]

function shortID(id: string) {
  return id.slice(0, 8)
}

function fmtDate(v: string | null) {
  if (!v) return '-'
  return new Date(v).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
}

const formOpen = ref(false)

const periodOptions = computed(() => [
  { label: 'Semua Periode', value: 'all' },
  ...store.periods.map(p => ({ label: `${p.code} — ${p.name}`, value: p.id })),
])

const statusOptions = [
  { label: 'Semua Status', value: 'all' },
  { label: 'Menunggu', value: 'pending' },
  { label: 'Selesai', value: 'completed' },
  { label: 'Dibatalkan', value: 'cancelled' },
]

const confirmOpen = ref(false)
const confirmTitle = ref('')
const confirmMessage = ref('')
const confirmAction = ref<'complete' | 'cancel'>('complete')
const confirmRunning = ref(false)
const selected = ref<SantriRegistration | null>(null)

function completeRegistration(row: SantriRegistration) {
  selected.value = row
  confirmAction.value = 'complete'
  confirmTitle.value = 'Selesaikan Herregistrasi'
  confirmMessage.value = `Tandai registrasi santri (${row.santri_nis ?? row.santri_id}) sebagai selesai?`
  confirmOpen.value = true
}

function cancelRegistration(row: SantriRegistration) {
  selected.value = row
  confirmAction.value = 'cancel'
  confirmTitle.value = 'Batalkan Herregistrasi'
  confirmMessage.value = `Yakin ingin membatalkan registrasi santri (${row.santri_nis ?? row.santri_id}) untuk periode '${row.period_name ?? ''}'?`
  confirmOpen.value = true
}

async function confirmActionRun() {
  if (!selected.value) return
  confirmRunning.value = true
  try {
    if (confirmAction.value === 'complete') {
      await store.completeRegistration(selected.value.id)
      toast.add({ title: 'Herregistrasi diselesaikan', color: 'success' })
    } else {
      await store.cancelRegistration(selected.value.id)
      toast.add({ title: 'Herregistrasi dibatalkan', color: 'success' })
    }
    confirmOpen.value = false
    await load()
  } catch {
    toast.add({ title: store.error ?? 'Gagal mengubah registrasi', color: 'error' })
  } finally {
    confirmRunning.value = false
  }
}

function rowActions(row: SantriRegistration): DropdownMenuItem[] {
  const items: DropdownMenuItem[] = []
  if (row.status === 'pending') {
    items.push({ label: 'Selesaikan', icon: 'i-lucide-check-circle', onSelect: () => completeRegistration(row) })
    items.push({ type: 'separator' })
    items.push({ label: 'Batalkan', icon: 'i-lucide-x-circle', color: 'error', onSelect: () => cancelRegistration(row) })
  }
  return items
}
</script>

<template>
  <div class="mx-auto max-w-7xl px-4 py-8">
    <div class="mb-6 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Herregistrasi</h1>
        <p class="mt-1 text-sm text-gray-700 dark:text-gray-300">Registrasi administratif santri pada periode akademik.</p>
      </div>
      <UButton
        v-if="can('manage_akademik')"
        icon="i-lucide-plus"
        class="bg-teal-600 text-white hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-400"
        @click="formOpen = true"
      >
        Registrasi Santri
      </UButton>
    </div>

    <div class="mb-4 flex flex-wrap gap-3">
      <USelect v-model="periodFilter" :items="periodOptions" size="sm" class="w-64" />
      <USelect v-model="statusFilter" :items="statusOptions" size="sm" class="w-40" />
    </div>

    <div class="overflow-x-auto rounded-lg border border-gray-200 bg-white dark:border-gray-700/50 dark:bg-gray-900">
      <UTable
        :data="store.registrations"
        :columns="columns"
        :loading="store.isLoading"
        class="w-full"
        :ui="{ th: 'text-gray-900 font-bold dark:text-gray-100' }"
      >
        <template #santri_nis-cell="{ row }">
          <span class="font-mono text-sm font-medium text-gray-900 dark:text-gray-100">{{ row.original.santri_nis ?? '-' }}</span>
        </template>

        <template #santri_id-cell="{ row }">
          <span class="font-mono text-xs text-gray-500 dark:text-gray-400">{{ shortID(row.original.santri_id) }}</span>
        </template>

        <template #status-cell="{ row }">
          <AkademikStatusBadge :status="row.original.status" type="registration" size="sm" />
        </template>

        <template #registered_at-cell="{ row }">
          <span class="text-sm text-gray-700 dark:text-gray-300">{{ fmtDate(row.original.registered_at) }}</span>
        </template>

        <template #actions-cell="{ row }">
          <AppRowActions v-if="can('manage_akademik')" :items="rowActions(row.original)" />
        </template>
      </UTable>
    </div>

    <div class="mt-4 flex flex-wrap items-center justify-between gap-3">
      <p class="text-sm text-gray-700 dark:text-gray-300">
        Total {{ totalItems }} registrasi · hal. {{ page }} / {{ totalPages }}
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

    <AdminAkademikRegistrationFormModal
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
      @confirm="confirmActionRun"
    />
  </div>
</template>
