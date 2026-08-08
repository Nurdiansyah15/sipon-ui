<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import { useKeuanganStore } from '~/stores/keuangan'
import { useKesantrianStore } from '~/stores/kesantrian'
import type { BillingBatch, BillingBatchTarget } from '#shared/types/Keuangan'

definePageMeta({ layout: 'keuangan' })

const route = useRoute()
const store = useKeuanganStore()
const santriStore = useKesantrianStore()

const batchId = computed(() => route.params.id as string)

const santriNameById = computed(() => {
  const map = new Map<string, string>()
  for (const s of santriStore.santriList) {
    map.set(s.id, s.fullname ? `${s.fullname}${s.nis ? ` (${s.nis})` : ''}` : s.nis ?? s.username)
  }
  return map
})

function santriLabel(santriId: string) {
  return santriNameById.value.get(santriId) ?? santriId
}

const batchStatusLabel: Record<BillingBatch['status'], string> = {
  processing: 'Diproses',
  completed: 'Selesai',
  failed: 'Gagal',
}

const batchStatusColor: Record<BillingBatch['status'], 'warning' | 'success' | 'error'> = {
  processing: 'warning',
  completed: 'success',
  failed: 'error',
}

const targetStatusLabel: Record<BillingBatchTarget['status'], string> = {
  pending: 'Menunggu',
  created: 'Dibuat',
  skipped_no_assignment: 'Dilewati - tidak ada skema',
  skipped_wrong_scheme: 'Dilewati - beda skema',
  skipped_already_invoiced: 'Dilewati - sudah ditagih',
  skipped_component_missing: 'Dilewati - komponen tidak ditemukan',
  error: 'Error',
}

const targetStatusColor: Record<BillingBatchTarget['status'], 'neutral' | 'success' | 'warning' | 'error'> = {
  pending: 'neutral',
  created: 'success',
  skipped_no_assignment: 'neutral',
  skipped_wrong_scheme: 'neutral',
  skipped_already_invoiced: 'warning',
  skipped_component_missing: 'warning',
  error: 'error',
}

const targetColumns: TableColumn<BillingBatchTarget>[] = [
  { accessorKey: 'santri_id', header: 'Santri' },
  { accessorKey: 'status', header: 'Status' },
  { accessorKey: 'reason', header: 'Keterangan' },
  { id: 'actions', header: '' },
]

function formatDateTime(v: string | null) {
  if (!v) return '-'
  return new Date(v).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })
}

async function load() {
  try {
    await Promise.all([
      store.fetchBillingBatch(batchId.value),
      santriStore.fetchSantriList({ limit: 100 }),
    ])
  } catch {
    /* error in store */
  }
}

onMounted(load)
</script>

<template>
  <div class="mx-auto max-w-5xl px-4 py-8">
    <div class="mb-6">
      <UButton
        color="neutral"
        variant="ghost"
        icon="i-lucide-arrow-left"
        size="sm"
        class="mb-3"
        @click="navigateTo('/admin/keuangan/tagihan/batch')"
      >
        Kembali ke Generate Massal
      </UButton>
      <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Detail Batch Tagihan</h1>
    </div>

    <div v-if="store.isLoading && !store.currentBillingBatch" class="py-12 text-center text-gray-500 dark:text-gray-400">
      Memuat detail batch...
    </div>

    <template v-else-if="store.currentBillingBatch">
      <div class="mb-6 rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700/50 dark:bg-gray-900">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p class="text-lg font-semibold text-gray-900 dark:text-gray-100">{{ store.currentBillingBatch.name }}</p>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Dibuat {{ formatDateTime(store.currentBillingBatch.created_at) }}
              <span v-if="store.currentBillingBatch.completed_at">
                &middot; selesai {{ formatDateTime(store.currentBillingBatch.completed_at) }}
              </span>
            </p>
          </div>
          <UBadge :color="batchStatusColor[store.currentBillingBatch.status]" variant="subtle">
            {{ batchStatusLabel[store.currentBillingBatch.status] }}
          </UBadge>
        </div>

        <div class="mt-6 grid grid-cols-3 gap-4">
          <div class="rounded border border-gray-200 bg-gray-50 p-4 text-center dark:border-gray-700 dark:bg-gray-800">
            <p class="text-2xl font-bold text-green-600 dark:text-green-400">{{ store.currentBillingBatch.total_created }}</p>
            <p class="text-xs text-gray-500 dark:text-gray-400">Dibuat</p>
          </div>
          <div class="rounded border border-gray-200 bg-gray-50 p-4 text-center dark:border-gray-700 dark:bg-gray-800">
            <p class="text-2xl font-bold text-amber-600 dark:text-amber-400">{{ store.currentBillingBatch.total_skipped }}</p>
            <p class="text-xs text-gray-500 dark:text-gray-400">Dilewati</p>
          </div>
          <div class="rounded border border-gray-200 bg-gray-50 p-4 text-center dark:border-gray-700 dark:bg-gray-800">
            <p class="text-2xl font-bold text-red-600 dark:text-red-400">{{ store.currentBillingBatch.total_error }}</p>
            <p class="text-xs text-gray-500 dark:text-gray-400">Error</p>
          </div>
        </div>
      </div>

      <h2 class="mb-3 text-lg font-semibold text-gray-900 dark:text-gray-100">Rincian per Santri</h2>
      <div class="overflow-x-auto rounded-lg border border-gray-200 bg-white dark:border-gray-700/50 dark:bg-gray-900">
        <UTable
          :data="store.currentBillingBatch.targets"
          :columns="targetColumns"
          class="w-full"
          :ui="{ th: 'text-gray-900 font-bold dark:text-gray-100' }"
        >
          <template #santri_id-cell="{ row }">
            <span class="text-sm text-gray-700 dark:text-gray-300">{{ santriLabel(row.original.santri_id) }}</span>
          </template>

          <template #status-cell="{ row }">
            <UBadge :color="targetStatusColor[row.original.status]" variant="subtle" size="sm">
              {{ targetStatusLabel[row.original.status] }}
            </UBadge>
          </template>

          <template #reason-cell="{ row }">
            <span class="text-sm text-gray-500 dark:text-gray-400">{{ row.original.reason ?? '-' }}</span>
          </template>

          <template #actions-cell="{ row }">
            <UButton
              v-if="row.original.invoice_id"
              size="xs"
              color="neutral"
              variant="outline"
              @click="navigateTo(`/admin/keuangan/tagihan/${row.original.invoice_id}`)"
            >
              Lihat Tagihan
            </UButton>
          </template>
        </UTable>
      </div>
    </template>
  </div>
</template>
