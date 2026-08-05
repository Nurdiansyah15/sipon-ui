<script setup lang="ts">
import { useKeuanganStore } from '~/stores/keuangan'
import { parseApiError } from '~/utils/errorParser'
import type { Invoice } from '#shared/types/Keuangan'

definePageMeta({ layout: 'default' })

const keuanganStore = useKeuanganStore()
const router = useRouter()
const toast = useToast()

const statusFilter = ref<string | undefined>(undefined)

function formatRupiah(value: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value).replace('Rp', 'Rp ')
}

function formatDate(value?: string | null) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
}

const filteredInvoices = computed(() => {
  if (!statusFilter.value) return keuanganStore.invoices
  return keuanganStore.invoices.filter(inv => inv.status === statusFilter.value)
})

const totalOutstanding = computed(() => {
  return keuanganStore.invoices.reduce((sum, inv) => {
    const outstanding = inv.amount - inv.discount_amount - inv.paid_amount
    return sum + Math.max(0, outstanding)
  }, 0)
})

const totalPaid = computed(() => {
  return keuanganStore.invoices.reduce((sum, inv) => sum + inv.paid_amount, 0)
})

onMounted(async () => {
  try {
    await keuanganStore.fetchMyInvoices({ limit: 100 })
  } catch (err) {
    toast.add({ title: 'Gagal memuat data', description: parseApiError(err), color: 'error' })
  }
})

function getStatusColor(status: string): string {
  const colorMap: Record<string, string> = {
    draft: 'neutral',
    issued: 'info',
    partial: 'warning',
    paid: 'success',
    expired: 'error',
    cancelled: 'neutral',
  }
  return colorMap[status] || 'neutral'
}
</script>

<template>
  <div class="mx-auto max-w-7xl px-4 py-8">
    <div class="mb-8 flex items-start justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Tagihan Saya</h1>
        <p class="mt-1 text-sm text-gray-500">Lihat daftar tagihan dan status pembayaran Anda.</p>
      </div>
      <UButton color="neutral" variant="ghost" icon="i-lucide-arrow-left" size="sm" class="shrink-0" @click="router.push('/')">Kembali</UButton>
    </div>

    <!-- Summary Cards -->
    <div class="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <div class="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700/50 dark:bg-gray-900">
        <p class="text-sm text-gray-500">Total Tagihan</p>
        <p class="mt-2 text-2xl font-bold text-gray-900 dark:text-gray-100">{{ keuanganStore.invoicesMeta?.total ?? keuanganStore.invoices.length }}</p>
      </div>
      <div class="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700/50 dark:bg-gray-900">
        <p class="text-sm text-gray-500">Total Dibayar</p>
        <p class="mt-2 text-2xl font-bold text-green-600 dark:text-green-400">{{ formatRupiah(totalPaid) }}</p>
      </div>
      <div class="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700/50 dark:bg-gray-900">
        <p class="text-sm text-gray-500">Total Tunggakan</p>
        <p class="mt-2 text-2xl font-bold text-red-600 dark:text-red-400">{{ formatRupiah(totalOutstanding) }}</p>
      </div>
    </div>

    <!-- Filter -->
    <div class="mb-4 flex items-center gap-2">
      <USelect
        v-model="statusFilter"
        :items="[
          { label: 'Semua Status', value: undefined },
          { label: 'Diterbitkan', value: 'issued' },
          { label: 'Sebagian', value: 'partial' },
          { label: 'Lunas', value: 'paid' },
          { label: 'Kadaluarsa', value: 'expired' },
          { label: 'Dibatalkan', value: 'cancelled' },
        ]"
        placeholder="Filter status"
        class="w-48"
      />
    </div>

    <!-- Loading -->
    <div v-if="keuanganStore.isLoading" class="space-y-4">
      <USkeleton class="h-32 w-full" />
      <USkeleton class="h-32 w-full" />
    </div>

    <!-- Error -->
    <div v-else-if="keuanganStore.error" class="rounded-lg border border-red-200 bg-red-50 p-6 text-center dark:border-red-800 dark:bg-red-950">
      <UIcon name="i-lucide-alert-circle" class="mx-auto mb-2 h-8 w-8 text-red-500" />
      <p class="text-red-700 dark:text-red-300">{{ keuanganStore.error }}</p>
      <UButton class="mt-4" variant="soft" @click="keuanganStore.fetchMyInvoices({ limit: 100 })">Coba Lagi</UButton>
    </div>

    <!-- Empty -->
    <div v-else-if="filteredInvoices.length === 0" class="rounded-lg border border-gray-200 bg-white p-8 text-center dark:border-gray-700/50 dark:bg-gray-900">
      <UIcon name="i-lucide-file-text" class="mx-auto mb-3 h-12 w-12 text-gray-300" />
      <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Belum Ada Tagihan</h2>
      <p class="mt-2 text-gray-500 dark:text-gray-400">Tidak ada tagihan yang ditemukan.</p>
    </div>

    <!-- Invoice List -->
    <div v-else class="space-y-4">
      <div
        v-for="invoice in filteredInvoices"
        :key="invoice.id"
        class="cursor-pointer rounded-lg border border-gray-200 bg-white p-6 transition-colors hover:border-gray-300 dark:border-gray-700/50 dark:bg-gray-900 dark:hover:border-gray-600"
        @click="router.push(`/keuangan/tagihan/${invoice.id}`)"
      >
        <div class="flex items-start justify-between gap-4">
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">{{ invoice.invoice_number }}</h3>
              <KeuanganStatusBadge :status="invoice.status" type="invoice" size="sm" />
            </div>
            <div class="mt-2 space-y-1 text-sm text-gray-500">
              <p>
                <span class="font-medium text-gray-700 dark:text-gray-300">Komponen:</span>
                {{ invoice.fee_component?.name || '—' }}
              </p>
              <p>
                <span class="font-medium text-gray-700 dark:text-gray-300">Periode:</span>
                {{ invoice.periode }} {{ invoice.tahun_ajaran }}
              </p>
              <p>
                <span class="font-medium text-gray-700 dark:text-gray-300">Jatuh Tempo:</span>
                {{ formatDate(invoice.due_date) }}
              </p>
            </div>
          </div>
          <div class="text-right">
            <p class="text-xs text-gray-500">Total</p>
            <KeuanganAmountDisplay :amount="invoice.amount" />
            <div class="mt-2 space-y-1 text-xs">
              <p class="text-green-600 dark:text-green-400">Dibayar: {{ formatRupiah(invoice.paid_amount) }}</p>
              <p v-if="invoice.discount_amount > 0" class="text-blue-600 dark:text-blue-400">Diskon: {{ formatRupiah(invoice.discount_amount) }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
