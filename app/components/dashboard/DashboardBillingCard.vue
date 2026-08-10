<script setup lang="ts">
import { useKeuanganStore } from '~/stores/keuangan'
import { parseApiError } from '~/utils/errorParser'
import type { Invoice } from '#shared/types/Keuangan'

const keuanganStore = useKeuanganStore()
const toast = useToast()

const summary = computed(() => keuanganStore.myInvoiceSummary)

const outstandingInvoices = computed<Invoice[]>(() => {
  return keuanganStore.invoices
    .filter(inv => (inv.status === 'issued' || inv.status === 'partial') && inv.amount - inv.discount_amount - inv.paid_amount > 0)
    .slice(0, 3)
})

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
  return new Date(value).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

function outstandingOf(inv: Invoice): number {
  return Math.max(0, inv.amount - inv.discount_amount - inv.paid_amount)
}

async function handlePaid() {
  try {
    await Promise.all([
      keuanganStore.fetchMyInvoiceSummary(),
      keuanganStore.fetchMyInvoices({ limit: 50 }),
    ])
    toast.add({ title: 'Pembayaran Berhasil', description: 'Tagihan Anda telah dibayar.', color: 'success' })
  } catch (err) {
    toast.add({ title: 'Gagal memperbarui data', description: parseApiError(err), color: 'error' })
  }
}

onMounted(async () => {
  try {
    if (keuanganStore.invoices.length === 0) {
      await keuanganStore.fetchMyInvoices({ limit: 50 })
    }
  } catch (err) {
    toast.add({ title: 'Gagal memuat tagihan', description: parseApiError(err), color: 'error' })
  }
})
</script>

<template>
  <div class="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700/50 dark:bg-gray-900">
    <div class="mb-4 flex items-center justify-between">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Tagihan Keuangan</h3>
      <NuxtLink to="/keuangan/tagihan" class="text-sm text-teal-600 hover:underline dark:text-teal-400">
        Lihat Detail
      </NuxtLink>
    </div>

    <div v-if="keuanganStore.isLoading" class="py-8 text-center">
      <UIcon name="i-lucide-loader-2" class="mx-auto h-6 w-6 animate-spin text-gray-400" />
    </div>

    <div v-else-if="!summary || summary.jumlah_invoice === 0" class="py-8 text-center">
      <UIcon name="i-lucide-wallet" class="mx-auto h-10 w-10 text-gray-300 dark:text-gray-600" />
      <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">Belum ada tagihan.</p>
    </div>

    <div v-else>
      <div class="grid gap-4 sm:grid-cols-3">
        <div class="text-center">
          <p class="text-sm text-gray-500 dark:text-gray-400">Total Tagihan</p>
          <p class="mt-1 text-lg font-bold text-gray-900 dark:text-gray-100">
            {{ formatRupiah(summary.total_tagihan) }}
          </p>
        </div>
        <div class="text-center">
          <p class="text-sm text-gray-500 dark:text-gray-400">Total Dibayar</p>
          <p class="mt-1 text-lg font-bold text-green-600 dark:text-green-400">
            {{ formatRupiah(summary.total_terbayar) }}
          </p>
        </div>
        <div class="text-center">
          <p class="text-sm text-gray-500 dark:text-gray-400">Total Tunggakan</p>
          <p class="mt-1 text-lg font-bold text-red-600 dark:text-red-400">
            {{ formatRupiah(summary.total_tunggakan) }}
          </p>
        </div>
      </div>
      <div class="mt-4 flex items-center justify-center gap-4 text-xs text-gray-500 dark:text-gray-400">
        <span>
          <span class="font-medium text-green-600 dark:text-green-400">{{ summary.jumlah_lunas }}</span> lunas
        </span>
        <span>
          <span class="font-medium text-red-600 dark:text-red-400">{{ summary.jumlah_belum }}</span> belum lunas
        </span>
      </div>

      <!-- Outstanding invoices with quick pay -->
      <div v-if="outstandingInvoices.length > 0" class="mt-6 border-t border-gray-200 pt-4 dark:border-gray-700">
        <p class="mb-3 text-sm font-medium text-gray-900 dark:text-gray-100">Tagihan yang Perlu Dibayar</p>
        <div class="space-y-3">
          <div
            v-for="invoice in outstandingInvoices"
            :key="invoice.id"
            class="flex items-center justify-between gap-4 rounded-lg border border-gray-200 p-3 dark:border-gray-700/50"
          >
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2">
                <NuxtLink :to="`/keuangan/tagihan/${invoice.id}`" class="truncate font-medium text-gray-900 hover:underline dark:text-gray-100">
                  {{ invoice.invoice_number }}
                </NuxtLink>
              </div>
              <p class="mt-1 truncate text-sm text-gray-500 dark:text-gray-400">
                {{ invoice.fee_component?.name || '—' }} · {{ formatDate(invoice.due_date) }}
              </p>
            </div>
            <div class="flex shrink-0 items-center gap-3">
              <KeuanganAmountDisplay :amount="outstandingOf(invoice)" />
              <MidtransPayButton
                :invoice-id="invoice.id"
                :amount="outstandingOf(invoice)"
                size="sm"
                @paid="handlePaid"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
