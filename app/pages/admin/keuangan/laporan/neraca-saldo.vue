<script setup lang="ts">
import { useKeuanganReportsStore } from '~/stores/keuanganReports'
import { useKeuanganAccountingStore } from '~/stores/keuanganAccounting'
import { usePermission } from '~/composables/usePermission'
import type { TrialBalanceLine } from '#shared/types/Keuangan'

definePageMeta({ layout: 'keuangan' })

const reportsStore = useKeuanganReportsStore()
const accStore = useKeuanganAccountingStore()
const { can } = usePermission()

const filterPeriodId = ref('')

const periodItems = computed(() =>
  accStore.periods.map((p) => ({
    label: `${p.name} (${p.start_date} s/d ${p.end_date})`,
    value: p.id,
  })),
)

async function loadData() {
  if (!filterPeriodId.value) return
  try {
    await reportsStore.fetchTrialBalance({ period_id: filterPeriodId.value })
  } catch {
    // error handled in store
  }
}

onMounted(async () => {
  try {
    await accStore.fetchPeriods({ limit: 100 })
  } catch {
    // error handled in store
  }
})

const columns: TrialBalanceLine[] = []

function accountTypeLabel(type: string) {
  const map: Record<string, string> = {
    asset: 'Aset',
    liability: 'Kewajiban',
    equity: 'Ekuitas',
    revenue: 'Pendapatan',
    expense: 'Beban',
  }
  return map[type] || type
}
</script>

<template>
  <div class="bg-gray-50 dark:bg-gray-950">
    <div class="mx-auto max-w-7xl px-4 py-8">
      <div class="mb-6">
        <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Laporan Neraca Saldo</h1>
        <p class="mt-1 text-sm text-gray-700 dark:text-gray-300">Daftar saldo semua akun pada periode tertentu.</p>
      </div>

      <div class="mb-4 flex flex-wrap items-end gap-3 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700/50 dark:bg-gray-900">
        <div class="w-72">
          <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Periode <span class="text-red-500">*</span></label>
          <USelect
            v-model="filterPeriodId"
            :items="periodItems"
            placeholder="Pilih periode"
            class="w-full"
            :ui="{ base: 'bg-gray-50 dark:bg-gray-800', value: 'text-gray-900 dark:text-gray-100' }"
          />
        </div>
        <UButton
          color="neutral"
          variant="outline"
          icon="i-lucide-search"
          :disabled="!filterPeriodId"
          @click="loadData"
        >
          Tampilkan
        </UButton>
        <UButton color="neutral" variant="ghost" icon="i-lucide-printer" @click="window.print()">
          Cetak
        </UButton>
      </div>

      <div v-if="reportsStore.trialBalance" class="overflow-x-auto rounded-lg border border-gray-200 bg-white dark:border-gray-700/50 dark:bg-gray-900">
        <div class="border-b border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-700 dark:bg-gray-800">
          <div class="flex flex-wrap items-center gap-4 text-sm">
            <div>
              <span class="text-gray-500 dark:text-gray-400">Periode:</span>
              <span class="ml-1 font-semibold text-gray-900 dark:text-gray-100">{{ reportsStore.trialBalance.period_name }}</span>
            </div>
          </div>
        </div>

        <div v-if="reportsStore.isLoading" class="flex items-center justify-center py-12">
          <UIcon name="i-lucide-loader-2" class="h-6 w-6 animate-spin text-gray-400" />
          <span class="ml-2 text-sm text-gray-500">Memuat data...</span>
        </div>

        <div v-else-if="reportsStore.trialBalance.lines.length === 0" class="flex flex-col items-center justify-center py-12">
          <UIcon name="i-lucide-inbox" class="h-10 w-10 text-gray-300 dark:text-gray-600" />
          <p class="mt-2 text-sm text-gray-500">Tidak ada data neraca saldo.</p>
        </div>

        <table v-else class="w-full text-left text-sm">
          <thead class="border-b border-gray-200 bg-gray-50 text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100">
            <tr>
              <th class="px-4 py-3 font-bold">Kode Akun</th>
              <th class="px-4 py-3 font-bold">Nama Akun</th>
              <th class="px-4 py-3 font-bold">Tipe</th>
              <th class="px-4 py-3 text-right font-bold">Debit</th>
              <th class="px-4 py-3 text-right font-bold">Kredit</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
            <tr v-for="line in reportsStore.trialBalance.lines" :key="line.account_id" class="hover:bg-gray-50 dark:hover:bg-gray-800/50">
              <td class="px-4 py-3 font-mono text-sm text-gray-900 dark:text-gray-100">{{ line.account_code }}</td>
              <td class="px-4 py-3 text-gray-900 dark:text-gray-100">{{ line.account_name }}</td>
              <td class="px-4 py-3">
                <UBadge color="neutral" variant="subtle" size="sm">{{ accountTypeLabel(line.account_type) }}</UBadge>
              </td>
              <td class="px-4 py-3 text-right">
                <KeuanganAmountDisplay v-if="line.debit > 0" :amount="line.debit" variant="debit" />
                <span v-else class="text-gray-400">-</span>
              </td>
              <td class="px-4 py-3 text-right">
                <KeuanganAmountDisplay v-if="line.credit > 0" :amount="line.credit" variant="credit" />
                <span v-else class="text-gray-400">-</span>
              </td>
            </tr>
          </tbody>
          <tfoot class="border-t-2 border-gray-300 bg-gray-50 font-bold dark:border-gray-600 dark:bg-gray-800">
            <tr>
              <td class="px-4 py-3" colspan="3">
                <span class="text-gray-900 dark:text-gray-100">TOTAL</span>
              </td>
              <td class="px-4 py-3 text-right">
                <KeuanganAmountDisplay :amount="reportsStore.trialBalance.total_debit" variant="debit" />
              </td>
              <td class="px-4 py-3 text-right">
                <KeuanganAmountDisplay :amount="reportsStore.trialBalance.total_credit" variant="credit" />
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div v-else-if="!reportsStore.isLoading" class="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-white py-16 dark:border-gray-700 dark:bg-gray-900">
        <UIcon name="i-lucide-scale" class="h-10 w-10 text-gray-300 dark:text-gray-600" />
        <p class="mt-2 text-sm text-gray-500">Pilih periode, lalu klik Tampilkan.</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
@media print {
  .bg-gray-50 { background: white !important; }
}
</style>
