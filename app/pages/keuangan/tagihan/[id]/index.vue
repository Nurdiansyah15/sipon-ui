<script setup lang="ts">
import { useKeuanganStore } from '~/stores/keuangan'
import { parseApiError } from '~/utils/errorParser'
import type { Invoice } from '#shared/types/Keuangan'

definePageMeta({ layout: 'default' })

const route = useRoute()
const router = useRouter()
const keuanganStore = useKeuanganStore()
const toast = useToast()

const invoice = ref<Invoice | null>(null)
const payments = computed(() => invoice.value?.payments ?? [])
const adjustments = computed(() => invoice.value?.adjustments ?? [])

const isChildRoute = computed(() => {
  const id = route.params.id as string
  const indexPath = `/keuangan/tagihan/${id}`
  return route.path !== indexPath
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
  return new Date(value).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
}

function formatDateTime(value?: string | null) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const outstandingAmount = computed(() => {
  if (!invoice.value) return 0
  return Math.max(0, invoice.value.amount - invoice.value.discount_amount - invoice.value.paid_amount)
})

const adjustmentTypeLabel: Record<string, string> = {
  beasiswa: 'Beasiswa',
  diskon: 'Diskon',
  penyesuaian: 'Penyesuaian',
}

const paymentMethodLabel: Record<string, string> = {
  transfer: 'Transfer',
  cash: 'Tunai',
  check: 'Cek',
}

onMounted(async () => {
  try {
    const invoiceId = route.params.id as string
    invoice.value = await keuanganStore.fetchMyInvoice(invoiceId)
  } catch (err) {
    toast.add({ title: 'Gagal memuat data', description: parseApiError(err), color: 'error' })
    router.push('/keuangan/tagihan')
  }
})
</script>

<template>
  <div class="mx-auto max-w-7xl px-4 py-8">
    <NuxtPage v-if="isChildRoute" />

    <template v-else>
      <div class="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Detail Tagihan</h1>
          <p class="mt-1 text-sm text-gray-500">Informasi lengkap tagihan dan riwayat pembayaran.</p>
        </div>
        <div class="flex shrink-0 items-center gap-2">
          <UButton
            v-if="invoice && outstandingAmount > 0 && ['issued', 'partial'].includes(invoice.status)"
            icon="i-lucide-credit-card"
            class="bg-teal-600 text-white hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-400"
            size="sm"
            @click="router.push(`/keuangan/tagihan/${invoice.id}/bayar`)"
          >
            Bayar Tagihan
          </UButton>
          <UButton color="neutral" variant="ghost" icon="i-lucide-arrow-left" size="sm" @click="router.push('/keuangan/tagihan')">Kembali</UButton>
        </div>
      </div>

    <!-- Loading -->
    <div v-if="keuanganStore.isLoading" class="space-y-4">
      <USkeleton class="h-64 w-full" />
    </div>

    <!-- Error -->
    <div v-else-if="keuanganStore.error" class="rounded-lg border border-red-200 bg-red-50 p-6 text-center dark:border-red-800 dark:bg-red-950">
      <UIcon name="i-lucide-alert-circle" class="mx-auto mb-2 h-8 w-8 text-red-500" />
      <p class="text-red-700 dark:text-red-300">{{ keuanganStore.error }}</p>
      <UButton class="mt-4" variant="soft" @click="router.push('/keuangan/tagihan')">Kembali</UButton>
    </div>

    <!-- Invoice Detail -->
    <div v-else-if="invoice" class="space-y-6">
      <!-- Invoice Info Card -->
      <div class="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700/50 dark:bg-gray-900">
        <div class="mb-5 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950">
              <UIcon name="i-lucide-file-text" class="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 class="font-semibold text-gray-900 dark:text-gray-100">{{ invoice.invoice_number }}</h3>
              <p class="text-sm text-gray-500">{{ invoice.billing_period?.name ?? '-' }}</p>
            </div>
          </div>
          <KeuanganStatusBadge :status="invoice.status" type="invoice" size="md" />
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
          <div>
            <p class="text-xs text-gray-500">Komponen</p>
            <p class="font-medium text-gray-900 dark:text-gray-100">{{ invoice.fee_component?.name || '—' }}</p>
          </div>
          <div>
            <p class="text-xs text-gray-500">Jatuh Tempo</p>
            <p class="font-medium text-gray-900 dark:text-gray-100">{{ formatDate(invoice.due_date) }}</p>
          </div>
          <div>
            <p class="text-xs text-gray-500">Tanggal Diterbitkan</p>
            <p class="font-medium text-gray-900 dark:text-gray-100">{{ formatDate(invoice.issued_at) }}</p>
          </div>
          <div>
            <p class="text-xs text-gray-500">Dibuat</p>
            <p class="font-medium text-gray-900 dark:text-gray-100">{{ formatDateTime(invoice.created_at) }}</p>
          </div>
        </div>

        <div v-if="invoice.notes" class="mt-4 rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
          <p class="text-xs text-gray-500">Catatan</p>
          <p class="mt-1 text-sm text-gray-700 dark:text-gray-300">{{ invoice.notes }}</p>
        </div>

        <!-- Amount Summary -->
        <div class="mt-6 border-t border-gray-200 pt-6 dark:border-gray-700">
          <div class="space-y-2">
            <div class="flex items-center justify-between text-sm">
              <span class="text-gray-500">Total Tagihan</span>
              <span class="font-medium text-gray-900 dark:text-gray-100">{{ formatRupiah(invoice.amount) }}</span>
            </div>
            <div v-if="invoice.discount_amount > 0" class="flex items-center justify-between text-sm">
              <span class="text-gray-500">Diskon</span>
              <span class="font-medium text-blue-600 dark:text-blue-400">- {{ formatRupiah(invoice.discount_amount) }}</span>
            </div>
            <div class="flex items-center justify-between text-sm">
              <span class="text-gray-500">Dibayar</span>
              <span class="font-medium text-green-600 dark:text-green-400">- {{ formatRupiah(invoice.paid_amount) }}</span>
            </div>
            <div class="flex items-center justify-between border-t border-gray-200 pt-2 dark:border-gray-700">
              <span class="font-semibold text-gray-900 dark:text-gray-100">Sisa Tagihan</span>
              <span class="text-lg font-bold" :class="outstandingAmount > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'">
                {{ formatRupiah(outstandingAmount) }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Payments Section -->
      <div class="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700/50 dark:bg-gray-900">
        <div class="mb-5 flex items-center gap-3">
          <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-50 dark:bg-green-950">
            <UIcon name="i-lucide-credit-card" class="h-5 w-5 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h3 class="font-semibold text-gray-900 dark:text-gray-100">Riwayat Pembayaran</h3>
            <p class="text-sm text-gray-500">Daftar pembayaran untuk tagihan ini.</p>
          </div>
        </div>

        <div v-if="payments.length === 0" class="py-8 text-center text-gray-500 dark:text-gray-400">
          Belum ada pembayaran.
        </div>

        <div v-else class="space-y-3">
          <div
            v-for="payment in payments"
            :key="payment.id"
            class="rounded-lg border border-gray-200 p-4 dark:border-gray-700/50"
          >
            <div class="flex items-start justify-between gap-4">
              <div class="flex-1">
                <div class="flex items-center gap-2">
                  <p class="font-medium text-gray-900 dark:text-gray-100">{{ payment.payment_number }}</p>
                  <KeuanganStatusBadge :status="payment.status" type="payment" size="xs" />
                </div>
                <div class="mt-2 space-y-1 text-sm text-gray-500">
                  <p>
                    <span class="font-medium text-gray-700 dark:text-gray-300">Metode:</span>
                    {{ paymentMethodLabel[payment.method] || payment.method }}
                  </p>
                  <p v-if="payment.reference_number">
                    <span class="font-medium text-gray-700 dark:text-gray-300">Referensi:</span>
                    {{ payment.reference_number }}
                  </p>
                  <p>
                    <span class="font-medium text-gray-700 dark:text-gray-300">Tanggal:</span>
                    {{ formatDate(payment.payment_date) }}
                  </p>
                </div>
                <p v-if="payment.notes" class="mt-2 text-sm text-gray-600 dark:text-gray-300">
                  {{ payment.notes }}
                </p>
              </div>
              <div class="text-right">
                <KeuanganAmountDisplay :amount="payment.amount" variant="credit" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Adjustments Section -->
      <div v-if="invoice.discount_amount > 0" class="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700/50 dark:bg-gray-900">
        <div class="mb-5 flex items-center gap-3">
          <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950">
            <UIcon name="i-lucide-percent" class="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 class="font-semibold text-gray-900 dark:text-gray-100">Penyesuaian</h3>
            <p class="text-sm text-gray-500">Diskon atau penyesuaian yang diterapkan.</p>
          </div>
        </div>

        <div v-if="adjustments.length === 0" class="py-8 text-center text-gray-500 dark:text-gray-400">
          Detail penyesuaian tidak tersedia.
        </div>

        <div v-else class="space-y-3">
          <div
            v-for="adj in adjustments"
            :key="adj.id"
            class="rounded-lg border border-gray-200 p-4 dark:border-gray-700/50"
          >
            <div class="flex items-start justify-between gap-4">
              <div class="flex-1">
                <div class="flex items-center gap-2">
                  <UBadge color="blue" variant="subtle" size="xs">
                    {{ adjustmentTypeLabel[adj.type] || adj.type }}
                  </UBadge>
                </div>
                <p v-if="adj.description" class="mt-2 text-sm text-gray-600 dark:text-gray-300">
                  {{ adj.description }}
                </p>
                <p class="mt-1 text-xs text-gray-400">
                  Diterapkan: {{ formatDateTime(adj.applied_at) }}
                </p>
              </div>
              <div class="text-right">
                <KeuanganAmountDisplay :amount="adj.amount" variant="credit" />
                <p v-if="adj.percentage" class="text-xs text-gray-500">{{ adj.percentage }}%</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Not Found -->
    <div v-else class="rounded-lg border border-gray-200 bg-white p-8 text-center dark:border-gray-700/50 dark:bg-gray-900">
      <UIcon name="i-lucide-file-x" class="mx-auto mb-3 h-12 w-12 text-gray-300" />
      <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Tagihan Tidak Ditemukan</h2>
      <p class="mt-2 text-gray-500 dark:text-gray-400">Tagihan yang Anda cari tidak ada atau telah dihapus.</p>
      <UButton class="mt-4" @click="router.push('/keuangan/tagihan')">Kembali ke Daftar</UButton>
    </div>
    </template>
  </div>
</template>
