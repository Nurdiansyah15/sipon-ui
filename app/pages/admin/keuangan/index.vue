<script setup lang="ts">
import { useKeuanganStore } from '~/stores/keuangan'
import { usePermission } from '~/composables/usePermission'

definePageMeta({ layout: 'keuangan' })

const store = useKeuanganStore()
const { can } = usePermission()
const toast = useToast()

const loading = ref(true)
const totalComponents = ref(0)
const totalSchemes = ref(0)
const totalOutstanding = ref(0)
const totalMonthlyPayment = ref(0)

onMounted(async () => {
  loading.value = true
  try {
    await Promise.all([
      store.fetchFeeComponents({ limit: 1, is_active: true }),
      store.fetchBillingSchemes({ limit: 1, is_active: true }),
      store.fetchInvoices({ limit: 1, status: 'issued' }),
      store.fetchPayments({ limit: 100 }),
    ])

    totalComponents.value = store.feeComponentsMeta?.total ?? 0
    totalSchemes.value = store.billingSchemesMeta?.total ?? 0
    totalOutstanding.value = store.invoicesMeta?.total ?? 0

    const now = new Date()
    totalMonthlyPayment.value = store.payments
      .filter((p) => {
        const d = new Date(p.payment_date)
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() && p.status === 'verified'
      })
      .reduce((sum, p) => sum + p.amount, 0)
  } catch {
    toast.add({ title: 'Gagal memuat ringkasan data', color: 'error' })
  } finally {
    loading.value = false
  }
})

function formatCurrency(value: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value)
}

const cards = [
  { label: 'Komponen Biaya Aktif', key: 'components', icon: 'i-lucide-receipt', color: 'text-teal-600 dark:text-teal-400', bg: 'bg-teal-50 dark:bg-teal-950' },
  { label: 'Skema Tagihan Aktif', key: 'schemes', icon: 'i-lucide-layers', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950' },
  { label: 'Invoice Outstanding', key: 'outstanding', icon: 'i-lucide-clock', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950' },
  { label: 'Pembayaran Bulan Ini', key: 'monthly', icon: 'i-lucide-wallet', color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-950' },
]

function cardValue(key: string) {
  switch (key) {
    case 'components': return totalComponents.value.toLocaleString('id-ID')
    case 'schemes': return totalSchemes.value.toLocaleString('id-ID')
    case 'outstanding': return totalOutstanding.value.toLocaleString('id-ID')
    case 'monthly': return formatCurrency(totalMonthlyPayment.value)
    default: return '0'
  }
}
</script>

<template>
  <div class="mx-auto max-w-7xl px-4 py-8">
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Keuangan</h1>
      <p class="mt-1 text-sm text-gray-700 dark:text-gray-300">
        Kelola komponen biaya, skema tagihan, invoice, dan pembayaran.
      </p>
    </div>

    <div v-if="loading" class="flex justify-center py-16">
      <UIcon name="i-lucide-loader-circle" class="h-8 w-8 animate-spin text-teal-600" />
    </div>

    <template v-else>
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div
          v-for="card in cards"
          :key="card.key"
          class="flex items-center gap-4 rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-700/50 dark:bg-gray-900"
        >
          <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg" :class="card.bg">
            <UIcon :name="card.icon" class="h-6 w-6" :class="card.color" />
          </div>
          <div class="min-w-0 flex-1">
            <p class="text-sm text-gray-500 dark:text-gray-400">{{ card.label }}</p>
            <p class="text-xl font-bold text-gray-900 dark:text-gray-100">{{ cardValue(card.key) }}</p>
          </div>
        </div>
      </div>

      <div class="mt-8">
        <h2 class="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">Modul Keuangan</h2>
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <FeatureModuleCard
            v-if="can('manage_keuangan')"
            title="Komponen Biaya"
            description="Kelola daftar komponen biaya: UKT, SPP, daftar ulang, dan insidental."
            icon="i-lucide-receipt"
            to="/admin/keuangan/komponen"
          />
          <FeatureModuleCard
            v-if="can('manage_keuangan')"
            title="Skema Tagihan"
            description="Kelola skema tagihan dan kelengkapan item di dalamnya."
            icon="i-lucide-layers"
            to="/admin/keuangan/skema"
          />
          <FeatureModuleCard
            v-if="can('manage_keuangan')"
            title="Penetapan Santri"
            description="Tetapkan skema tagihan ke santri beserta periode berlakunya."
            icon="i-lucide-user-check"
            to="/admin/keuangan/santri"
          />
        </div>
      </div>
    </template>
  </div>
</template>
