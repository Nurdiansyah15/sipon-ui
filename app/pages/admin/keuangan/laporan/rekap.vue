<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import { useKeuanganReportsStore } from '~/stores/keuanganReports'
import { usePermission } from '~/composables/usePermission'
import type { InvoiceSummary } from '#shared/types/Keuangan'

definePageMeta({ layout: 'keuangan' })

const store = useKeuanganReportsStore()
const { can } = usePermission()

const filterTahunAjaran = ref('')
const filterPeriode = ref('')

async function loadData() {
  try {
    await store.fetchSummary({
      tahun_ajaran: filterTahunAjaran.value || undefined,
      periode: filterPeriode.value || undefined,
    })
  } catch {
    // error handled in store
  }
}

onMounted(loadData)

const columns: TableColumn<InvoiceSummary>[] = [
  { accessorKey: 'tahun_ajaran', header: 'Tahun Ajaran' },
  { accessorKey: 'periode', header: 'Periode' },
  { id: 'total_amount', header: 'Total Tagihan' },
  { id: 'total_paid', header: 'Total Terbayar' },
  { id: 'total_outstanding', header: 'Total Tunggakan' },
  { id: 'invoice_count', header: 'Jumlah Invoice' },
  { id: 'paid_count', header: 'Jumlah Lunas' },
  { id: 'unpaid_count', header: 'Jumlah Belum' },
]

const totals = computed(() => {
  return store.summary.reduce(
    (acc, row) => {
      acc.total_amount += row.total_amount
      acc.total_paid += row.total_paid
      acc.total_outstanding += row.total_outstanding
      acc.invoice_count += row.invoice_count
      acc.paid_count += row.paid_count
      return acc
    },
    { total_amount: 0, total_paid: 0, total_outstanding: 0, invoice_count: 0, paid_count: 0 },
  )
})

function formatRupiah(value: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value).replace('Rp', 'Rp ')
}
</script>

<template>
  <div class="bg-gray-50 dark:bg-gray-950">
    <div class="mx-auto max-w-7xl px-4 py-8">
      <div class="mb-6">
        <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Laporan Rekap Tagihan & Pembayaran</h1>
        <p class="mt-1 text-sm text-gray-700 dark:text-gray-300">Ringkasan tagihan dan pembayaran per periode.</p>
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
        <div>
          <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Periode</label>
          <UInput
            v-model="filterPeriode"
            placeholder="cth. Januari 2026"
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

        <div v-else-if="store.summary.length === 0" class="flex flex-col items-center justify-center py-12">
          <UIcon name="i-lucide-inbox" class="h-10 w-10 text-gray-300 dark:text-gray-600" />
          <p class="mt-2 text-sm text-gray-500">Belum ada data laporan.</p>
        </div>

        <table v-else class="w-full text-left text-sm">
          <thead class="border-b border-gray-200 bg-gray-50 text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100">
            <tr>
              <th class="px-4 py-3 font-bold">Tahun Ajaran</th>
              <th class="px-4 py-3 font-bold">Periode</th>
              <th class="px-4 py-3 text-right font-bold">Total Tagihan</th>
              <th class="px-4 py-3 text-right font-bold">Total Terbayar</th>
              <th class="px-4 py-3 text-right font-bold">Total Tunggakan</th>
              <th class="px-4 py-3 text-right font-bold">Jumlah Invoice</th>
              <th class="px-4 py-3 text-right font-bold">Jumlah Lunas</th>
              <th class="px-4 py-3 text-right font-bold">Jumlah Belum</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
            <tr v-for="(row, idx) in store.summary" :key="idx" class="hover:bg-gray-50 dark:hover:bg-gray-800/50">
              <td class="px-4 py-3 text-gray-900 dark:text-gray-100">{{ row.tahun_ajaran }}</td>
              <td class="px-4 py-3 text-gray-900 dark:text-gray-100">{{ row.periode }}</td>
              <td class="px-4 py-3 text-right">
                <KeuanganAmountDisplay :amount="row.total_amount" />
              </td>
              <td class="px-4 py-3 text-right">
                <KeuanganAmountDisplay :amount="row.total_paid" variant="credit" />
              </td>
              <td class="px-4 py-3 text-right">
                <KeuanganAmountDisplay :amount="row.total_outstanding" variant="debit" />
              </td>
              <td class="px-4 py-3 text-right font-semibold text-gray-900 dark:text-gray-100">{{ row.invoice_count }}</td>
              <td class="px-4 py-3 text-right text-green-600 dark:text-green-400">{{ row.paid_count }}</td>
              <td class="px-4 py-3 text-right text-red-600 dark:text-red-400">{{ row.invoice_count - row.paid_count }}</td>
            </tr>
          </tbody>
          <tfoot class="border-t-2 border-gray-300 bg-gray-50 font-bold dark:border-gray-600 dark:bg-gray-800">
            <tr>
              <td class="px-4 py-3 text-gray-900 dark:text-gray-100" colspan="2">TOTAL</td>
              <td class="px-4 py-3 text-right">
                <KeuanganAmountDisplay :amount="totals.total_amount" />
              </td>
              <td class="px-4 py-3 text-right">
                <KeuanganAmountDisplay :amount="totals.total_paid" variant="credit" />
              </td>
              <td class="px-4 py-3 text-right">
                <KeuanganAmountDisplay :amount="totals.total_outstanding" variant="debit" />
              </td>
              <td class="px-4 py-3 text-right text-gray-900 dark:text-gray-100">{{ totals.invoice_count }}</td>
              <td class="px-4 py-3 text-right text-green-600 dark:text-green-400">{{ totals.paid_count }}</td>
              <td class="px-4 py-3 text-right text-red-600 dark:text-red-400">{{ totals.invoice_count - totals.paid_count }}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  </div>
</template>

<style scoped>
@media print {
  .bg-gray-50 { background: white !important; }
}
</style>
