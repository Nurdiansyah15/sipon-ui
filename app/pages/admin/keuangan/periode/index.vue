<script setup lang="ts">
import type { TableColumn, DropdownMenuItem } from '@nuxt/ui'
import { useKeuanganAccountingStore } from '~/stores/keuanganAccounting'
import { usePermission } from '~/composables/usePermission'
import type { AccountingPeriod, PeriodStatus } from '#shared/types/Keuangan'

definePageMeta({ layout: 'keuangan' })

const store = useKeuanganAccountingStore()
const toast = useToast()
const { can } = usePermission()

const page = ref(1)
const limit = ref(10)

const createModalOpen = ref(false)
const closeModalOpen = ref(false)
const reopenModalOpen = ref(false)
const lockModalOpen = ref(false)
const selectedPeriod = ref<AccountingPeriod | null>(null)

async function load() {
  try {
    await store.fetchPeriods({
      page: page.value,
      limit: limit.value,
    })
  } catch {
    // error in store
  }
}

onMounted(load)

watch([page, limit], () => load())

const columns: TableColumn<AccountingPeriod>[] = [
  { accessorKey: 'name', header: 'Nama Periode' },
  { accessorKey: 'start_date', header: 'Tanggal Mulai' },
  { accessorKey: 'end_date', header: 'Tanggal Selesai' },
  { accessorKey: 'status', header: 'Status' },
  { accessorKey: 'closed_by', header: 'Ditutup Oleh' },
  { id: 'actions', header: '' },
]

const totalPages = computed(() => store.periodsMeta?.total_pages ?? 1)
const totalItems = computed(() => store.periodsMeta?.total ?? 0)

function formatDate(v: string) {
  return new Date(v).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
}

function rowActions(row: AccountingPeriod): DropdownMenuItem[] {
  const items: DropdownMenuItem[] = []

  if (!can('close_period')) return items

  if (row.status === 'open') {
    items.push({
      label: 'Tutup Periode',
      icon: 'i-lucide-lock',
      onSelect: () => {
        selectedPeriod.value = row
        closeModalOpen.value = true
      },
    })
  }

  if (row.status === 'closed') {
    items.push({
      label: 'Buka Kembali',
      icon: 'i-lucide-unlock',
      onSelect: () => {
        selectedPeriod.value = row
        reopenModalOpen.value = true
      },
    })
    items.push({ type: 'separator' })
    items.push({
      label: 'Kunci Periode',
      icon: 'i-lucide-lock-keyhole',
      color: 'error',
      onSelect: () => {
        selectedPeriod.value = row
        lockModalOpen.value = true
      },
    })
  }

  return items
}

async function handleClose() {
  if (!selectedPeriod.value) return
  try {
    await store.closePeriod(selectedPeriod.value.id)
    toast.add({ title: 'Periode berhasil ditutup', color: 'success' })
    closeModalOpen.value = false
    await load()
  } catch (err) {
    toast.add({ title: 'Gagal menutup periode', description: store.error || undefined, color: 'error' })
  }
}

async function handleReopen() {
  if (!selectedPeriod.value) return
  try {
    await store.reopenPeriod(selectedPeriod.value.id)
    toast.add({ title: 'Periode berhasil dibuka kembali', color: 'success' })
    reopenModalOpen.value = false
    await load()
  } catch (err) {
    toast.add({ title: 'Gagal membuka periode', description: store.error || undefined, color: 'error' })
  }
}

async function handleLock() {
  if (!selectedPeriod.value) return
  try {
    await store.lockPeriod(selectedPeriod.value.id)
    toast.add({ title: 'Periode berhasil dikunci', color: 'success' })
    lockModalOpen.value = false
    await load()
  } catch (err) {
    toast.add({ title: 'Gagal mengunci periode', description: store.error || undefined, color: 'error' })
  }
}

function onPeriodSuccess() {
  createModalOpen.value = false
  load()
}
</script>

<template>
  <div class="mx-auto max-w-7xl px-4 py-8">
    <div class="mb-6 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Periode Akuntansi</h1>
        <p class="mt-1 text-sm text-gray-700 dark:text-gray-300">
          Kelola periode akuntansi: buka, tutup, dan kunci periode untuk mengontrol pencatatan transaksi.
        </p>
      </div>
      <UButton
        v-if="can('close_period')"
        icon="i-lucide-plus"
        @click="createModalOpen = true"
      >
        Buat Periode
      </UButton>
    </div>

    <div class="overflow-x-auto rounded-lg border border-gray-200 bg-white dark:border-gray-700/50 dark:bg-gray-900">
      <UTable
        :data="store.periods"
        :columns="columns"
        :loading="store.isLoading"
        class="w-full"
        :ui="{ th: 'text-gray-900 font-bold dark:text-gray-100' }"
      >
        <template #name-cell="{ row }">
          <span class="text-sm font-medium text-gray-900 dark:text-gray-100">{{ row.original.name }}</span>
        </template>

        <template #start_date-cell="{ row }">
          <span class="text-sm text-gray-700 dark:text-gray-300">{{ formatDate(row.original.start_date) }}</span>
        </template>

        <template #end_date-cell="{ row }">
          <span class="text-sm text-gray-700 dark:text-gray-300">{{ formatDate(row.original.end_date) }}</span>
        </template>

        <template #status-cell="{ row }">
          <KeuanganStatusBadge :status="row.original.status" type="period" size="sm" />
        </template>

        <template #closed_by-cell="{ row }">
          <span v-if="row.original.closed_by" class="text-sm text-gray-700 dark:text-gray-300">
            {{ row.original.closed_by }}
          </span>
          <span v-else class="text-xs text-gray-400">—</span>
        </template>

        <template #actions-cell="{ row }">
          <AppRowActions v-if="rowActions(row.original).length > 0" :items="rowActions(row.original)" />
        </template>
      </UTable>
    </div>

    <div v-if="totalItems > 0" class="mt-4 flex flex-wrap items-center justify-between gap-3">
      <p class="text-sm text-gray-700 dark:text-gray-300">
        Total {{ totalItems }} periode · hal. {{ page }} / {{ totalPages }}
      </p>
      <UPagination
        v-model:page="page"
        :total="totalItems"
        :items-per-page="limit"
        :sibling-count="1"
        show-edges
      />
    </div>

    <AdminKeuanganAdminPeriodFormModal
      v-model:open="createModalOpen"
      @success="onPeriodSuccess"
    />

    <ConfirmActionModal
      v-model:open="closeModalOpen"
      title="Tutup Periode"
      :description="`Apakah Anda yakin ingin menutup periode '${selectedPeriod?.name}'? Tidak ada transaksi baru yang dapat dicatat pada periode ini.`"
      confirm-label="Tutup Periode"
      confirm-color="primary"
      :loading="store.isSubmitting"
      @confirm="handleClose"
    />

    <ConfirmActionModal
      v-model:open="reopenModalOpen"
      title="Buka Kembali Periode"
      :description="`Apakah Anda yakin ingin membuka kembali periode '${selectedPeriod?.name}'? Transaksi baru dapat dicatat pada periode ini.`"
      confirm-label="Buka Kembali"
      confirm-color="primary"
      :loading="store.isSubmitting"
      @confirm="handleReopen"
    />

    <ConfirmActionModal
      v-model:open="lockModalOpen"
      title="Kunci Periode"
      :description="`PERINGATAN: Mengunci periode '${selectedPeriod?.name}' bersifat permanen dan tidak dapat dibatalkan. Tidak ada perubahan yang dapat dilakukan pada periode ini.`"
      confirm-label="Kunci Permanen"
      confirm-color="error"
      :loading="store.isSubmitting"
      @confirm="handleLock"
    />
  </div>
</template>
