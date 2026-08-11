<script setup lang="ts">
import type { TableColumn, DropdownMenuItem } from '@nuxt/ui'
import { useAkademikStore } from '~/stores/akademik'
import { usePermission } from '~/composables/usePermission'
import type { AcademicPeriod } from '#shared/types/Akademik'

definePageMeta({ layout: 'akademik' })

const store = useAkademikStore()
const toast = useToast()
const { can } = usePermission()

const page = ref(1)
const limit = ref(10)
const statusFilter = ref<string>('all')

watch([page, limit, statusFilter], () => load())

async function load() {
  try {
    await store.fetchPeriods({
      page: page.value,
      limit: limit.value,
      status: statusFilter.value === 'all' ? undefined : statusFilter.value as any,
    })
  } catch {
    // error in store
  }
}

onMounted(load)

const totalPages = computed(() => store.periodsMeta?.total_pages ?? 1)
const totalItems = computed(() => store.periodsMeta?.total ?? 0)

const columns: TableColumn<AcademicPeriod>[] = [
  { accessorKey: 'code', header: 'Kode' },
  { accessorKey: 'name', header: 'Nama' },
  { accessorKey: 'start_date', header: 'Mulai' },
  { accessorKey: 'end_date', header: 'Selesai' },
  { accessorKey: 'status', header: 'Status' },
  { id: 'actions', header: '' },
]

function formatDate(v: string) {
  return new Date(v).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
}

const formOpen = ref(false)
const editTarget = ref<AcademicPeriod | null>(null)

function openCreate() {
  editTarget.value = null
  formOpen.value = true
}

function openEdit(row: AcademicPeriod) {
  editTarget.value = row
  formOpen.value = true
}

const confirmOpen = ref(false)
const confirmTitle = ref('')
const confirmMessage = ref('')
const confirmAction = ref<'open' | 'close'>('open')
const confirmRunning = ref(false)
const selected = ref<AcademicPeriod | null>(null)

function openPeriod(row: AcademicPeriod) {
  selected.value = row
  confirmAction.value = 'open'
  confirmTitle.value = 'Buka Periode'
  confirmMessage.value = `Yakin ingin membuka periode '${row.name}'? Santri baru bisa mulai herregistrasi setelah periode dibuka.`
  confirmOpen.value = true
}

function closePeriod(row: AcademicPeriod) {
  selected.value = row
  confirmAction.value = 'close'
  confirmTitle.value = 'Tutup Periode'
  confirmMessage.value = `Yakin ingin menutup periode '${row.name}'?`
  confirmOpen.value = true
}

async function confirmTransition() {
  if (!selected.value) return
  confirmRunning.value = true
  try {
    if (confirmAction.value === 'open') {
      await store.openPeriod(selected.value.id)
      toast.add({ title: 'Periode dibuka', color: 'success' })
    } else {
      await store.closePeriod(selected.value.id)
      toast.add({ title: 'Periode ditutup', color: 'success' })
    }
    confirmOpen.value = false
    await load()
  } catch {
    toast.add({ title: store.error ?? 'Gagal mengubah status periode', color: 'error' })
  } finally {
    confirmRunning.value = false
  }
}

function rowActions(row: AcademicPeriod): DropdownMenuItem[] {
  const items: DropdownMenuItem[] = []
  if (row.status === 'draft') {
    items.push({ label: 'Edit', icon: 'i-lucide-pencil', onSelect: () => openEdit(row) })
    items.push({ type: 'separator' })
    items.push({ label: 'Buka Periode', icon: 'i-lucide-play', onSelect: () => openPeriod(row) })
  } else {
    items.push({ label: 'Lihat', icon: 'i-lucide-eye', onSelect: () => openEdit(row) })
  }
  if (row.status === 'open') {
    items.push({ type: 'separator' })
    items.push({ label: 'Tutup Periode', icon: 'i-lucide-lock', onSelect: () => closePeriod(row) })
  }
  return items
}

const statusOptions = [
  { label: 'Semua Status', value: 'all' },
  { label: 'Draft', value: 'draft' },
  { label: 'Buka', value: 'open' },
  { label: 'Tutup', value: 'closed' },
  { label: 'Arsip', value: 'archived' },
]
</script>

<template>
  <div class="mx-auto max-w-7xl px-4 py-8">
    <div class="mb-6 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Periode Akademik</h1>
        <p class="mt-1 text-sm text-gray-700 dark:text-gray-300">Kelola periode akademik dan siklus hidupnya (draft → open → closed).</p>
      </div>
      <UButton
        v-if="can('manage_akademik')"
        icon="i-lucide-plus"
        class="bg-teal-600 text-white hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-400"
        @click="openCreate"
      >
        Buat Periode
      </UButton>
    </div>

    <div class="mb-4 max-w-xs">
      <USelect v-model="statusFilter" :items="statusOptions" size="sm" class="w-full" />
    </div>

    <div class="overflow-x-auto rounded-lg border border-gray-200 bg-white dark:border-gray-700/50 dark:bg-gray-900">
      <UTable
        :data="store.periods"
        :columns="columns"
        :loading="store.isLoading"
        class="w-full"
        :ui="{ th: 'text-gray-900 font-bold dark:text-gray-100' }"
      >
        <template #code-cell="{ row }">
          <span class="font-mono text-sm font-medium text-gray-900 dark:text-gray-100">{{ row.original.code }}</span>
        </template>

        <template #start_date-cell="{ row }">
          <span class="text-sm text-gray-700 dark:text-gray-300">{{ formatDate(row.original.start_date) }}</span>
        </template>

        <template #end_date-cell="{ row }">
          <span class="text-sm text-gray-700 dark:text-gray-300">{{ formatDate(row.original.end_date) }}</span>
        </template>

        <template #status-cell="{ row }">
          <AkademikStatusBadge :status="row.original.status" type="period" size="sm" />
        </template>

        <template #actions-cell="{ row }">
          <AppRowActions v-if="can('manage_akademik')" :items="rowActions(row.original)" />
        </template>
      </UTable>
    </div>

    <div class="mt-4 flex flex-wrap items-center justify-between gap-3">
      <p class="text-sm text-gray-700 dark:text-gray-300">
        Total {{ totalItems }} periode · hal. {{ page }} / {{ totalPages }}
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

    <AdminAkademikPeriodFormModal
      v-model:open="formOpen"
      :period="editTarget"
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
