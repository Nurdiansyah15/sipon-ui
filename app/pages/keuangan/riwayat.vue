<script setup lang="ts">
import { useKeuanganStore } from '~/stores/keuangan'
import { parseApiError } from '~/utils/errorParser'

definePageMeta({ layout: 'default' })

const keuanganStore = useKeuanganStore()
const router = useRouter()
const toast = useToast()

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

const paymentMethodLabel: Record<string, string> = {
  transfer: 'Transfer',
  cash: 'Tunai',
  check: 'Cek',
}

const totalPaid = computed(() => {
  return keuanganStore.payments
    .filter(p => p.status === 'verified')
    .reduce((sum, p) => sum + p.amount, 0)
})

onMounted(async () => {
  try {
    await keuanganStore.fetchMyPayments({ limit: 100 })
  } catch (err) {
    toast.add({ title: 'Gagal memuat data', description: parseApiError(err), color: 'error' })
  }
})
</script>

<template>
  <div class="mx-auto max-w-7xl px-4 py-8">
    <div class="mb-8 flex items-start justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Riwayat Pembayaran</h1>
        <p class="mt-1 text-sm text-gray-500">Lihat riwayat pembayaran yang telah Anda lakukan.</p>
      </div>
      <UButton color="neutral" variant="ghost" icon="i-lucide-arrow-left" size="sm" class="shrink-0" @click="router.push('/keuangan/tagihan')">Kembali</UButton>
    </div>

    <!-- Summary -->
    <div class="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <div class="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700/50 dark:bg-gray-900">
        <p class="text-sm text-gray-500">Total Pembayaran</p>
        <p class="mt-2 text-2xl font-bold text-gray-900 dark:text-gray-100">{{ keuanganStore.paymentsMeta?.total ?? keuanganStore.payments.length }}</p>
      </div>
      <div class="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700/50 dark:bg-gray-900">
        <p class="text-sm text-gray-500">Total Dibayar (Terverifikasi)</p>
        <p class="mt-2 text-2xl font-bold text-green-600 dark:text-green-400">{{ formatRupiah(totalPaid) }}</p>
      </div>
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
      <UButton class="mt-4" variant="soft" @click="keuanganStore.fetchMyPayments({ limit: 100 })">Coba Lagi</UButton>
    </div>

    <!-- Empty -->
    <div v-else-if="keuanganStore.payments.length === 0" class="rounded-lg border border-gray-200 bg-white p-8 text-center dark:border-gray-700/50 dark:bg-gray-900">
      <UIcon name="i-lucide-credit-card" class="mx-auto mb-3 h-12 w-12 text-gray-300" />
      <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Belum Ada Pembayaran</h2>
      <p class="mt-2 text-gray-500 dark:text-gray-400">Anda belum melakukan pembayaran apapun.</p>
      <UButton class="mt-4" to="/keuangan/tagihan">Lihat Tagihan</UButton>
    </div>

    <!-- Payment List -->
    <div v-else class="space-y-4">
      <div
        v-for="payment in keuanganStore.payments"
        :key="payment.id"
        class="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700/50 dark:bg-gray-900"
      >
        <div class="flex items-start justify-between gap-4">
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">{{ payment.payment_number }}</h3>
              <KeuanganStatusBadge :status="payment.status" type="payment" size="sm" />
            </div>
            <div class="mt-3 space-y-1 text-sm text-gray-500">
              <p v-if="payment.invoice">
                <span class="font-medium text-gray-700 dark:text-gray-300">Tagihan:</span>
                <NuxtLink :to="`/keuangan/tagihan/${payment.invoice_id}`" class="text-blue-600 hover:underline dark:text-blue-400">
                  {{ payment.invoice.invoice_number }}
                </NuxtLink>
              </p>
              <p>
                <span class="font-medium text-gray-700 dark:text-gray-300">Metode:</span>
                {{ paymentMethodLabel[payment.method] || payment.method }}
              </p>
              <p v-if="payment.reference_number">
                <span class="font-medium text-gray-700 dark:text-gray-300">Referensi:</span>
                {{ payment.reference_number }}
              </p>
              <p>
                <span class="font-medium text-gray-700 dark:text-gray-300">Tanggal Pembayaran:</span>
                {{ formatDate(payment.payment_date) }}
              </p>
              <p>
                <span class="font-medium text-gray-700 dark:text-gray-300">Dibuat:</span>
                {{ formatDateTime(payment.created_at) }}
              </p>
            </div>
            <p v-if="payment.notes" class="mt-3 text-sm text-gray-600 dark:text-gray-300">
              <span class="font-medium text-gray-700 dark:text-gray-300">Catatan:</span>
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
</template>
