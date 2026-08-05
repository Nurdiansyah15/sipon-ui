<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import { useKeuanganReportsStore } from '~/stores/keuanganReports'
import { usePermission } from '~/composables/usePermission'
import type { OutstandingBySantri } from '#shared/types/Keuangan'

definePageMeta({ layout: 'keuangan' })

const store = useKeuanganReportsStore()
const { can } = usePermission()

const filterTahunAjaran = ref('')
const page = ref(1)
const limit = ref(10)

const sortField = ref<'total_outstanding' | null>('total_outstanding')
const sortDir = ref<'asc' | 'desc'>('desc')

async function loadData() {
  try {
    await store.fetchOutstanding({
      tahun_ajaran: filterTahunAjaran.value || undefined,
    })
  } catch {
    // error handled in store
  }
}

onMounted(loadData)

function toggleSort() {
  if (sortField.value === 'total_outstanding') {
    sortDir.value = sortDir.value === 'desc' ? 'asc' : 'desc'
  } else {
    sortField.value = 'total_outstanding'
    sortDir.value = 'desc'
  }
}

function sortIcon() {
  if (sortField.value !== 'total_outstanding') return 'i-lucide-arrow-up-down'
  return sortDir.value === 'desc' ? 'i-lucide-arrow-down' : 'i-lucide-arrow-up'
}

const sortedData = computed(() => {
  const data = [...store.outstanding]
  if (sortField.value === 'total_outstanding') {
    data.sort((a, b) => {
      const diff = a.total_outstanding - b.total_outstanding
      return sortDir.value === 'desc' ? -diff : diff
    })
  }
  return data
})

const paginatedData = computed(() => {
  const start = (page.value - 1) * limit.value
  return sortedData.value.slice(start, start + limit.value)
})

const totalPages = computed(() => Math.ceil(store.outstanding.length / limit.value) || 1)
const totalItems = computed(() => store.outstanding.length)

watch(store.outstanding, () => {
  page.value = 1
})

const columns: TableColumn<OutstandingBySantri>[] = [
  { accessorKey: 'santri_id', header: 'Santri ID' },
  { id: 'total_outstanding', header: 'Total Outstanding' },
  { accessorKey: 'invoice_count', header: 'Jumlah Invoice' },
]
</script>

<template>
  <div class="bg-gray-50 dark:bg-gray-950">
    <div class="mx-auto max-w-7xl px-4 py-8">
      <div class="mb-6">
        <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Laporan Tunggakan per Santri</h1>
        <p class="mt-1 text-sm text-gray-700 dark:text-gray-300">Daftar santri dengan tunggakan tagihan.</p>
      </div>

      <div class="mb-4 flex flex-wrap items-end gap-3 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700/50 dark:bg-gray-900">
        <div>
          <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Tahun Ajaran</label>
          <UInput
            v-model="filterTahunAjaran"
            placeholder="cth. 2025/2026"
            class="w-48"
            :ui="{ base: 'bg-gray-50 dark:bg-gray-800' }"
          />
        </div>
        <UButton color="neutral" variant="outline" icon="i-lucide-search" @click="loadData">
          Tampilkan
        </UButton>
        <UButton color="neutral" variant="ghost" icon="i-lucide-printer" @click="window.print()">
          Cetak
        </UButton>
      </div>

      <div class="overflow-x-auto rounded-lg border border-gray-200 bg-white dark:border-gray-700/50 dark:bg-gray-900">
        <div v-if="store.isLoading" class="flex items-center justify-center py-12">
          <UIcon name="i-lucide-loader-2" class="h-6 w-6 animate-spin text-gray-400" />
          <span class="ml-2 text-sm text-gray-500">Memuat data...</span>
        </div>

        <div v-else-if="store.outstanding.length === 0" class="flex flex-col items-center justify-center py-12">
          <UIcon name="i-lucide-inbox" class="h-10 w-10 text-gray-300 dark:text-gray-600" />
          <p class="mt-2 text-sm text-gray-500">Belum ada data tunggakan.</p>
        </div>

        <table v-else class="w-full text-left text-sm">
          <thead class="border-b border-gray-200 bg-gray-50 text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100">
            <tr>
              <th class="px-4 py-3 font-bold">Santri ID</th>
              <th class="px-4 py-3 font-bold">
                <button class="inline-flex items-center gap-1 hover:text-teal-600" @click="toggleSort">
                  Total Outstanding
                  <UIcon :name="sortIcon()" class="h-4 w-4" />
                </button>
              </th>
              <th class="px-4 py-3 text-right font-bold">Jumlah Invoice</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
            <tr v-for="row in paginatedData" :key="row.santri_id" class="hover:bg-gray-50 dark:hover:bg-gray-800/50">
              <td class="px-4 py-3 font-mono text-sm text-gray-900 dark:text-gray-100">{{ row.santri_id }}</td>
              <td class="px-4 py-3">
                <KeuanganAmountDisplay :amount="row.total_outstanding" variant="debit" />
              </td>
              <td class="px-4 py-3 text-right font-semibold text-gray-900 dark:text-gray-100">{{ row.invoice_count }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="totalItems > 0" class="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p class="text-sm text-gray-700 dark:text-gray-300">
          Total {{ totalItems }} santri · hal. {{ page }} / {{ totalPages }}
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
    </div>
  </div>
</template>

<style scoped>
@media print {
  .bg-gray-50 { background: white !important; }
}
</style>
