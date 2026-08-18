<script setup lang="ts">
import type { TableColumn, DropdownMenuItem } from '@nuxt/ui'
import { useKeuanganStore } from '~/stores/keuangan'
import { usePermission } from '~/composables/usePermission'
import { useKeuanganPeriodContext } from '~/composables/useKeuanganPeriodContext'
import type { BillingPeriod } from '#shared/types/Keuangan'

definePageMeta({ layout: 'keuangan' })

const store = useKeuanganStore()
const toast = useToast()
const { can } = usePermission()
const { selectedPeriodId, loadPeriods, loadBillingPeriods, billingPeriodsInScope } = useKeuanganPeriodContext()

const page = ref(1)
const limit = ref(10)
const statusFilter = ref<string>('all')

const formOpen = ref(false)
const editTarget = ref<BillingPeriod | null>(null)
const openModalOpen = ref(false)
const closeModalOpen = ref(false)
const selectedPeriod = ref<BillingPeriod | null>(null)

// Daftar periode tagihan dibatasi ke periode akuntansi terpilih (periode kerja).
const scopedPeriods = computed(() => {
  let list = billingPeriodsInScope.value
  if (statusFilter.value && statusFilter.value !== 'all') {
    list = list.filter((p) => p.status === statusFilter.value)
  }
  return list
})

const paginatedPeriods = computed(() => {
  const start = (page.value - 1) * limit.value
  return scopedPeriods.value.slice(start, start + limit.value)
})

const totalPages = computed(() => Math.ceil(scopedPeriods.value.length / limit.value) || 1)
const totalItems = computed(() => scopedPeriods.value.length)

watch([statusFilter], () => {
  page.value = 1
})

onMounted(async () => {
  await Promise.all([loadPeriods(), loadBillingPeriods()])
})

const columns: TableColumn<BillingPeriod>[] = [
  { accessorKey: 'name', header: 'Nama Periode' },
  { accessorKey: 'period_type', header: 'Tipe' },
  { accessorKey: 'start_date', header: 'Tanggal Mulai' },
  { accessorKey: 'end_date', header: 'Tanggal Selesai' },
  { accessorKey: 'status', header: 'Status' },
  { id: 'actions', header: 'Aksi' },
]

const statusOptions = [
  { label: 'Semua status', value: 'all' },
  { label: 'Draft', value: 'draft' },
  { label: 'Buka', value: 'open' },
  { label: 'Tutup', value: 'closed' },
]

const periodTypeLabel: Record<string, string> = {
  monthly: 'Bulanan',
  weekly: 'Mingguan',
  semesterly: 'Semester',
  yearly: 'Tahunan',
  once: 'Sekali',
}

function formatDate(v: string) {
  return new Date(v).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
}

function rowActions(row: BillingPeriod): DropdownMenuItem[] {
  const items: DropdownMenuItem[] = []

  if (!can('manage_keuangan')) return items

  if (row.status === 'draft') {
    items.push({
      label: 'Edit',
      icon: 'i-lucide-pencil',
      onSelect: () => {
        editTarget.value = row
        formOpen.value = true
      },
    })
    items.push({
      label: 'Buka Periode',
      icon: 'i-lucide-unlock',
      onSelect: () => {
        selectedPeriod.value = row
        openModalOpen.value = true
      },
    })
  }

  if (row.status === 'open') {
    items.push({
      label: 'Tutup Periode',
      icon: 'i-lucide-lock',
      color: 'error',
      onSelect: () => {
        selectedPeriod.value = row
        closeModalOpen.value = true
      },
    })
  }

  return items
}

async function handleOpen() {
  if (!selectedPeriod.value) return
  try {
    await store.openBillingPeriod(selectedPeriod.value.id)
    toast.add({ title: 'Periode tagihan berhasil dibuka', color: 'success' })
    openModalOpen.value = false
  } catch {
    toast.add({ title: 'Gagal membuka periode tagihan', description: store.error ?? undefined, color: 'error' })
  }
}

async function handleClose() {
  if (!selectedPeriod.value) return
  try {
    await store.closeBillingPeriod(selectedPeriod.value.id)
    toast.add({ title: 'Periode tagihan berhasil ditutup', color: 'success' })
    closeModalOpen.value = false
  } catch {
    toast.add({ title: 'Gagal menutup periode tagihan', description: store.error ?? undefined, color: 'error' })
  }
}

function onPeriodSuccess() {
  formOpen.value = false
  editTarget.value = null
  loadBillingPeriods()
}
</script>

<template>
  <KeuanganPeriodGuard v-if="!selectedPeriodId" />
  <template v-else>
    <div class="mx-auto max-w-7xl px-4 py-8">
      <div class="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Periode Tagihan</h1>
          <p class="mt-1 text-sm text-gray-700 dark:text-gray-300">
            Kelola periode tagihan di bawah periode akuntansi ini: buat, buka, dan tutup periode yang digunakan saat membuat tagihan santri.
          </p>
        </div>
        <div class="flex items-center gap-2">
          <UButton
            to="/admin/keuangan/operasional"
            icon="i-lucide-arrow-left"
            color="neutral"
            variant="outline"
          >
            Kembali
          </UButton>
          <UButton
            v-if="can('manage_keuangan')"
            icon="i-lucide-plus"
            class="bg-teal-600 text-white hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-400"
            @click="formOpen = true; editTarget = null"
          >
            Buat Periode
          </UButton>
        </div>
      </div>

      <div class="mb-4 flex flex-wrap items-center gap-2">
        <USelect
          v-model="statusFilter"
          :items="statusOptions"
          class="w-44"
          :ui="{ base: 'bg-gray-50 dark:bg-gray-800', value: 'text-gray-900 dark:text-gray-100' }"
        />
      </div>

      <div class="overflow-x-auto rounded-lg border border-gray-200 bg-white dark:border-gray-700/50 dark:bg-gray-900">
        <UTable
          :data="paginatedPeriods"
          :columns="columns"
          :loading="store.isLoading"
          class="w-full"
          :ui="{ th: 'text-gray-900 font-bold dark:text-gray-100' }"
        >
          <template #name-cell="{ row }">
            <span class="text-sm font-medium text-gray-900 dark:text-gray-100">{{ row.original.name }}</span>
          </template>

          <template #period_type-cell="{ row }">
            <span class="text-sm text-gray-700 dark:text-gray-300">{{ periodTypeLabel[row.original.period_type] ?? row.original.period_type }}</span>
          </template>

          <template #start_date-cell="{ row }">
            <span class="text-sm text-gray-700 dark:text-gray-300">{{ formatDate(row.original.start_date) }}</span>
          </template>

          <template #end_date-cell="{ row }">
            <span class="text-sm text-gray-700 dark:text-gray-300">{{ formatDate(row.original.end_date) }}</span>
          </template>

          <template #status-cell="{ row }">
            <UBadge
              :color="row.original.status === 'open' ? 'success' : row.original.status === 'closed' ? 'neutral' : 'warning'"
              variant="subtle"
              size="sm"
            >
              {{ row.original.status === 'open' ? 'Buka' : row.original.status === 'closed' ? 'Tutup' : 'Draft' }}
            </UBadge>
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

      <AdminKeuanganAdminBillingPeriodFormModal
        v-model:open="formOpen"
        :period="editTarget"
        @success="onPeriodSuccess"
      />

      <AdminConfirmActionModal
        v-model:open="openModalOpen"
        title="Buka Periode Tagihan"
        :description="`Apakah Anda yakin ingin membuka periode '${selectedPeriod?.name}'? Periode ini akan tersedia untuk pembuatan tagihan.`"
        confirm-label="Buka Periode"
        color="primary"
        :loading="store.isSubmitting"
        @confirm="handleOpen"
      />

      <AdminConfirmActionModal
        v-model:open="closeModalOpen"
        title="Tutup Periode Tagihan"
        :description="`Apakah Anda yakin ingin menutup periode '${selectedPeriod?.name}'? Periode ini tidak lagi dapat dipilih saat membuat tagihan baru.`"
        confirm-label="Tutup Periode"
        color="error"
        :loading="store.isSubmitting"
        @confirm="handleClose"
      />
    </div>
  </template>
</template>
