<script setup lang="ts">
import { useKeuanganStore } from '~/stores/keuangan'
import { usePermission } from '~/composables/usePermission'
import type { Payment } from '#shared/types/Keuangan'

definePageMeta({ layout: 'keuangan' })

const route = useRoute()
const store = useKeuanganStore()
const toast = useToast()
const { can } = usePermission()

const paymentId = computed(() => String(route.params.id))
const payment = computed<Payment | null>(() => store.currentPayment)

const verificationOpen = ref(false)
const verificationTarget = ref<any>(null)

async function load() {
  try {
    await store.fetchPayment(paymentId.value)
  } catch {
    toast.add({
      title: 'Gagal memuat detail pembayaran',
      description: store.error ?? undefined,
      color: 'error',
    })
  }
}

onMounted(load)

function openVerification() {
  if (!payment.value) return
  verificationTarget.value = {
    id: payment.value.id,
    payment_number: payment.value.payment_number,
    amount: payment.value.amount,
    status: payment.value.status,
    invoice_number: payment.value.invoice?.invoice_number ?? undefined,
  }
  verificationOpen.value = true
}

async function handleDownloadReceipt() {
  try {
    const res = await store.downloadReceipt(paymentId.value)
    const blob = new Blob([res as any])
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `kwitansi-${paymentId.value}.pdf`
    a.click()
    window.URL.revokeObjectURL(url)
  } catch {
    toast.add({
      title: 'Gagal mengunduh kwitansi',
      description: store.error ?? undefined,
      color: 'error',
    })
  }
}

function formatRupiah(value: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value).replace('Rp', 'Rp ')
}

function formatDate(value?: string | null) {
  if (!value) return '-'
  try {
    return new Date(value).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return value
  }
}

function formatDateShort(value?: string | null) {
  if (!value) return '-'
  try {
    return new Date(value).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return value
  }
}

const methodLabels: Record<string, string> = {
  transfer: 'Transfer',
  cash: 'Tunai',
  check: 'Cek',
}

const canVerify = computed(() =>
  can('manage_keuangan') && payment.value?.status === 'pending',
)
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
        @click="navigateTo('/admin/keuangan/pembayaran')"
      >
        Kembali ke Daftar Pembayaran
      </UButton>
      <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">
        Detail Pembayaran
        <span v-if="payment" class="ml-2 text-sm font-normal text-gray-600 dark:text-gray-400">
          {{ payment.payment_number }}
        </span>
      </h1>
    </div>

    <div v-if="store.isLoading && !payment" class="flex items-center justify-center py-16">
      <UIcon name="i-lucide-loader-2" class="h-6 w-6 animate-spin text-gray-400" />
    </div>

    <template v-if="payment">
      <div class="mb-6 rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700/50 dark:bg-gray-900">
        <div class="mb-4 flex items-center justify-between">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Informasi Pembayaran</h2>
          <KeuanganStatusBadge :status="payment.status" type="payment" />
        </div>
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <p class="text-xs text-gray-500 dark:text-gray-400">No. Pembayaran</p>
            <p class="font-medium text-gray-900 dark:text-gray-100">{{ payment.payment_number }}</p>
          </div>
          <div>
            <p class="text-xs text-gray-500 dark:text-gray-400">No. Invoice</p>
            <p class="font-medium text-gray-900 dark:text-gray-100">
              {{ payment.invoice?.invoice_number ?? '-' }}
            </p>
          </div>
          <div>
            <p class="text-xs text-gray-500 dark:text-gray-400">Jumlah</p>
            <p class="font-semibold text-gray-900 dark:text-gray-100">{{ formatRupiah(payment.amount) }}</p>
          </div>
          <div>
            <p class="text-xs text-gray-500 dark:text-gray-400">Metode</p>
            <p class="font-medium text-gray-900 dark:text-gray-100">{{ methodLabels[payment.method] || payment.method }}</p>
          </div>
          <div>
            <p class="text-xs text-gray-500 dark:text-gray-400">Tanggal Bayar</p>
            <p class="font-medium text-gray-900 dark:text-gray-100">{{ formatDateShort(payment.payment_date) }}</p>
          </div>
          <div>
            <p class="text-xs text-gray-500 dark:text-gray-400">No. Referensi</p>
            <p class="font-medium text-gray-900 dark:text-gray-100">{{ payment.reference_number || '-' }}</p>
          </div>
          <div>
            <p class="text-xs text-gray-500 dark:text-gray-400">Akun Debit</p>
            <p class="font-medium text-gray-900 dark:text-gray-100">
              {{ payment.debit_account ? `${payment.debit_account.code} - ${payment.debit_account.name}` : '-' }}
            </p>
          </div>
          <div>
            <p class="text-xs text-gray-500 dark:text-gray-400">Diverifikasi oleh</p>
            <p class="text-sm text-gray-700 dark:text-gray-300">
              {{ payment.verified_by ? payment.verified_by : '-' }}
              <span v-if="payment.verified_at" class="text-gray-400 dark:text-gray-500">
                · {{ formatDate(payment.verified_at) }}
              </span>
            </p>
          </div>
          <div>
            <p class="text-xs text-gray-500 dark:text-gray-400">Dibuat</p>
            <p class="text-sm text-gray-700 dark:text-gray-300">{{ formatDate(payment.created_at) }}</p>
          </div>
        </div>
        <div v-if="payment.notes" class="mt-4 rounded border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800">
          <p class="text-xs text-gray-500 dark:text-gray-400">Catatan</p>
          <p class="mt-1 text-sm text-gray-700 dark:text-gray-300">{{ payment.notes }}</p>
        </div>
      </div>

      <div v-if="payment.invoice" class="mb-6 rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700/50 dark:bg-gray-900">
        <h2 class="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">Informasi Tagihan</h2>
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <p class="text-xs text-gray-500 dark:text-gray-400">No. Invoice</p>
            <p class="font-medium text-gray-900 dark:text-gray-100">{{ payment.invoice.invoice_number }}</p>
          </div>
          <div>
            <p class="text-xs text-gray-500 dark:text-gray-400">Total Tagihan</p>
            <p class="font-medium text-gray-900 dark:text-gray-100">{{ formatRupiah(payment.invoice.amount) }}</p>
          </div>
          <div>
            <p class="text-xs text-gray-500 dark:text-gray-400">Terbayar</p>
            <p class="font-semibold text-green-600 dark:text-green-400">{{ formatRupiah(payment.invoice.paid_amount) }}</p>
          </div>
          <div>
            <p class="text-xs text-gray-500 dark:text-gray-400">Periode</p>
            <p class="font-medium text-gray-900 dark:text-gray-100">{{ payment.invoice.periode }} - {{ payment.invoice.tahun_ajaran }}</p>
          </div>
          <div>
            <p class="text-xs text-gray-500 dark:text-gray-400">Jatuh Tempo</p>
            <p class="font-medium text-gray-900 dark:text-gray-100">{{ formatDateShort(payment.invoice.due_date) }}</p>
          </div>
          <div>
            <p class="text-xs text-gray-500 dark:text-gray-400">Status</p>
            <KeuanganStatusBadge :status="payment.invoice.status" type="invoice" size="sm" />
          </div>
        </div>
      </div>

      <div class="flex flex-wrap gap-2">
        <UButton
          v-if="canVerify"
          color="success"
          variant="outline"
          icon="i-lucide-shield-check"
          @click="openVerification"
        >
          Verifikasi / Tolak
        </UButton>
        <UButton
          v-if="payment.status === 'verified'"
          color="neutral"
          variant="outline"
          icon="i-lucide-download"
          @click="handleDownloadReceipt"
        >
          Unduh Kwitansi
        </UButton>
      </div>
    </template>

    <AdminPaymentVerificationModal
      v-model:open="verificationOpen"
      :payment="verificationTarget"
      @verified="load"
      @rejected="load"
    />
  </div>
</template>
