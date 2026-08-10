<script setup lang="ts">
import type { TableColumn, DropdownMenuItem } from '@nuxt/ui'
import { useKeuanganStore } from '~/stores/keuangan'
import { usePermission } from '~/composables/usePermission'
import type { FeeComponent } from '#shared/types/Keuangan'

definePageMeta({ layout: 'keuangan' })

const store = useKeuanganStore()
const toast = useToast()
const { can } = usePermission()

const page = ref(1)
const limit = ref(10)

watch([page, limit], () => load())

async function load() {
  try {
    await store.fetchFeeComponents({
      page: page.value,
      limit: limit.value,
    })
  } catch {
    // error set in store
  }
}

onMounted(load)

const totalPages = computed(() => store.feeComponentsMeta?.total_pages ?? 1)
const totalItems = computed(() => store.feeComponentsMeta?.total ?? 0)

const periodLabels: Record<string, string> = {
  monthly: 'Bulanan',
  semesterly: 'Semester',
  yearly: 'Tahunan',
  once: 'Sekali',
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value)
}

const columns: TableColumn<FeeComponent>[] = [
  { accessorKey: 'code', header: 'Kode' },
  { accessorKey: 'name', header: 'Nama' },
  { accessorKey: 'revenue_account', header: 'Akun Pendapatan' },
  { accessorKey: 'receivable_account', header: 'Akun Piutang' },
  { accessorKey: 'amount', header: 'Jumlah' },
  { accessorKey: 'is_periodic', header: 'Berkala' },
  { accessorKey: 'is_active', header: 'Aktif' },
  { id: 'actions', header: 'Aksi' },
]

const formOpen = ref(false)
const editTarget = ref<FeeComponent | null>(null)

function openCreate() {
  editTarget.value = null
  formOpen.value = true
}

function openEdit(row: FeeComponent) {
  editTarget.value = row
  formOpen.value = true
}

const deleteOpen = ref(false)
const deleteTarget = ref<FeeComponent | null>(null)
const deleteDeleting = ref(false)

function openDelete(row: FeeComponent) {
  deleteTarget.value = row
  deleteOpen.value = true
}

async function confirmDelete() {
  if (!deleteTarget.value) return
  deleteDeleting.value = true
  try {
    await store.deleteFeeComponent(deleteTarget.value.id)
    deleteOpen.value = false
    toast.add({ title: 'Komponen biaya dihapus', color: 'success' })
    await load()
  } catch {
    toast.add({ title: store.error ?? 'Gagal menghapus komponen biaya', color: 'error' })
  } finally {
    deleteDeleting.value = false
  }
}

async function toggleActive(row: FeeComponent) {
  try {
    await store.updateFeeComponent(row.id, {
      revenue_account_id: row.revenue_account_id,
      receivable_account_id: row.receivable_account_id,
      name: row.name,
      amount: row.amount,
      is_periodic: row.is_periodic,
      period_type: row.period_type ?? undefined,
      description: row.description ?? undefined,
    })
    toast.add({ title: 'Komponen biaya diperbarui', color: 'success' })
    await load()
  } catch {
    toast.add({ title: store.error ?? 'Gagal memperbarui komponen biaya', color: 'error' })
  }
}

function rowActions(row: FeeComponent): DropdownMenuItem[] {
  return [
    { label: 'Edit', icon: 'i-lucide-pencil', onSelect: () => openEdit(row) },
    { label: 'Hapus', icon: 'i-lucide-trash-2', color: 'error', onSelect: () => openDelete(row) },
  ]
}
</script>

<template>
  <div class="mx-auto max-w-7xl px-4 py-8">
    <div class="mb-6 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Komponen Biaya</h1>
        <p class="mt-1 text-sm text-gray-700 dark:text-gray-300">Kelola daftar komponen biaya beserta akun pendapatan & piutang dari COA.</p>
      </div>
      <UButton
        v-if="can('manage_keuangan')"
        icon="i-lucide-plus"
        class="bg-teal-600 text-white hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-400"
        @click="openCreate"
      >
        Tambah Komponen
      </UButton>
    </div>

    <div class="overflow-x-auto rounded-lg border border-gray-200 bg-white dark:border-gray-700/50 dark:bg-gray-900">
      <UTable
        :data="store.feeComponents"
        :columns="columns"
        :loading="store.isLoading"
        class="w-full"
        :ui="{ th: 'text-gray-900 font-bold dark:text-gray-100' }"
      >
        <template #revenue_account-cell="{ row }">
          <span class="text-sm text-gray-700 dark:text-gray-300">
            {{ row.original.revenue_account ? `${row.original.revenue_account.code} - ${row.original.revenue_account.name}` : '-' }}
          </span>
        </template>

        <template #receivable_account-cell="{ row }">
          <span class="text-sm text-gray-700 dark:text-gray-300">
            {{ row.original.receivable_account ? `${row.original.receivable_account.code} - ${row.original.receivable_account.name}` : '-' }}
          </span>
        </template>

        <template #amount-cell="{ row }">
          <span class="text-sm font-medium text-gray-900 dark:text-gray-100">{{ formatCurrency(row.original.amount) }}</span>
        </template>

        <template #is_periodic-cell="{ row }">
          <span class="text-sm text-gray-700 dark:text-gray-300">
            {{ row.original.is_periodic ? (periodLabels[row.original.period_type ?? ''] ?? 'Ya') : 'Tidak' }}
          </span>
        </template>

        <template #is_active-cell="{ row }">
          <UBadge :color="row.original.is_active ? 'success' : 'error'" variant="subtle" size="sm">
            {{ row.original.is_active ? 'Aktif' : 'Nonaktif' }}
          </UBadge>
        </template>

        <template #actions-cell="{ row }">
          <AppRowActions v-if="can('manage_keuangan')" :items="rowActions(row.original)" />
        </template>
      </UTable>
    </div>

    <div class="mt-4 flex flex-wrap items-center justify-between gap-3">
      <p class="text-sm text-gray-700 dark:text-gray-300">
        Total {{ totalItems }} komponen · hal. {{ page }} / {{ totalPages }}
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
            :color="curPage === item.value ? 'teal' : 'neutral'"
            :variant="curPage === item.value ? 'solid' : 'outline'"
            :label="String(item.value)"
            size="sm"
            :class="curPage === item.value ? 'bg-teal-600 text-white dark:bg-teal-500' : ''"
          />
        </template>
      </UPagination>
    </div>

    <AdminKeuanganAdminFeeComponentFormModal
      v-model:open="formOpen"
      :component="editTarget"
      @success="load"
    />

    <AdminConfirmActionModal
      :open="deleteOpen"
      title="Hapus Komponen Biaya"
      :description="`Yakin ingin menghapus komponen '${deleteTarget?.name ?? ''}'? Tindakan ini tidak dapat dibatalkan.`"
      confirm-label="Hapus"
      color="error"
      :loading="deleteDeleting"
      @update:open="deleteOpen = $event"
      @confirm="confirmDelete"
    />
  </div>
</template>
