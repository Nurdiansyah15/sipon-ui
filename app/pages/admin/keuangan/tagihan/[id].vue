<script setup lang="ts">
import { useKeuanganStore } from '~/stores/keuangan'
import { useKesantrianStore } from '~/stores/kesantrian'
import { usePermission } from '~/composables/usePermission'
import type { Invoice, InvoiceAdjustment, Payment } from '#shared/types/Keuangan'

definePageMeta({ layout: 'keuangan' })

const route = useRoute()
const store = useKeuanganStore()
const santriStore = useKesantrianStore()
const toast = useToast()
const { can } = usePermission()

const invoiceId = computed(() => String(route.params.id))

const invoice = computed<Invoice | null>(() => store.currentInvoice)

const santriLabel = computed(() => {
  if (!invoice.value) return '-'
  const s = santriStore.santriList.find((s) => s.id === invoice.value!.santri_id)
  if (!s) return invoice.value.santri_id
  return s.fullname ? `${s.fullname}${s.nis ? ` (${s.nis})` : ''}` : s.nis ?? s.username
})

async function load() {
  try {
    await Promise.all([
      store.fetchInvoice(invoiceId.value),
      santriStore.fetchSantriList({ limit: 100 }),
    ])
  } catch {
    toast.add({
      title: 'Gagal memuat detail tagihan',
      description: store.error ?? undefined,
      color: 'error',
    })
  }
}

onMounted(load)

const adjustmentOpen = ref(false)
const cancelOpen = ref(false)
const isCancelling = ref(false)

async function confirmCancel() {
  isCancelling.value = true
  try {
    await store.cancelInvoice(invoiceId.value)
    toast.add({ title: 'Tagihan berhasil dibatalkan', color: 'success' })
    cancelOpen.value = false
    await load()
  } catch {
    toast.add({
      title: 'Gagal membatalkan tagihan',
      description: store.error ?? undefined,
      color: 'error',
    })
  } finally {
    isCancelling.value = false
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

const adjustments = computed<InvoiceAdjustment[]>(() => {
  return invoice.value?.adjustments ?? []
})

const payments = computed<Payment[]>(() => {
  return invoice.value?.payments ?? []
})

const canApplyAdjustment = computed(() =>
  can('manage_keuangan') && invoice.value && (invoice.value.status === 'issued' || invoice.value.status === 'partial'),
)

const canCancel = computed(() =>
  can('manage_keuangan') && invoice.value && (invoice.value.status === 'draft' || invoice.value.status === 'issued'),
)

function outstandingAmount(inv: Invoice): number {
  return inv.amount - inv.discount_amount - inv.paid_amount
}
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
        @click="navigateTo('/admin/keuangan/tagihan')"
      >
        Kembali ke Daftar Tagihan
      </UButton>
      <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">
        Detail Tagihan
        <span v-if="invoice" class="ml-2 text-sm font-normal text-gray-600 dark:text-gray-400">
          {{ invoice.invoice_number }}
        </span>
      </h1>
    </div>

    <div v-if="store.isLoading && !invoice" class="flex items-center justify-center py-16">
      <UIcon name="i-lucide-loader-2" class="h-6 w-6 animate-spin text-gray-400" />
    </div>

    <template v-if="invoice">
      <div class="mb-6 rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700/50 dark:bg-gray-900">
        <div class="mb-4 flex items-center justify-between">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Informasi Tagihan</h2>
          <KeuanganStatusBadge :status="invoice.status" type="invoice" />
        </div>
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <p class="text-xs text-gray-500 dark:text-gray-400">No. Invoice</p>
            <p class="font-medium text-gray-900 dark:text-gray-100">{{ invoice.invoice_number }}</p>
          </div>
          <div>
            <p class="text-xs text-gray-500 dark:text-gray-400">Santri</p>
            <p class="font-medium text-gray-900 dark:text-gray-100">{{ santriLabel }}</p>
          </div>
          <div>
            <p class="text-xs text-gray-500 dark:text-gray-400">Komponen</p>
            <p class="font-medium text-gray-900 dark:text-gray-100">
              {{ invoice.fee_component ? `${invoice.fee_component.code} - ${invoice.fee_component.name}` : '-' }}
            </p>
          </div>
          <div>
            <p class="text-xs text-gray-500 dark:text-gray-400">Periode Tagihan</p>
            <p class="font-medium text-gray-900 dark:text-gray-100">{{ invoice.billing_period?.name ?? '-' }}</p>
          </div>
          <div>
            <p class="text-xs text-gray-500 dark:text-gray-400">Jatuh Tempo</p>
            <p class="font-medium text-gray-900 dark:text-gray-100">{{ formatDateShort(invoice.due_date) }}</p>
          </div>
          <div>
            <p class="text-xs text-gray-500 dark:text-gray-400">Jumlah Tagihan</p>
            <p class="font-semibold text-gray-900 dark:text-gray-100">{{ formatRupiah(invoice.amount) }}</p>
          </div>
          <div>
            <p class="text-xs text-gray-500 dark:text-gray-400">Diskon</p>
            <p class="font-medium text-gray-900 dark:text-gray-100">{{ formatRupiah(invoice.discount_amount) }}</p>
          </div>
          <div>
            <p class="text-xs text-gray-500 dark:text-gray-400">Terbayar</p>
            <p class="font-semibold text-green-600 dark:text-green-400">{{ formatRupiah(invoice.paid_amount) }}</p>
          </div>
          <div>
            <p class="text-xs text-gray-500 dark:text-gray-400">Sisa</p>
            <p class="font-semibold text-red-600 dark:text-red-400">{{ formatRupiah(outstandingAmount(invoice)) }}</p>
          </div>
          <div>
            <p class="text-xs text-gray-500 dark:text-gray-400">Diterbitkan</p>
            <p class="text-sm text-gray-700 dark:text-gray-300">{{ formatDate(invoice.issued_at) }}</p>
          </div>
          <div>
            <p class="text-xs text-gray-500 dark:text-gray-400">Dibuat</p>
            <p class="text-sm text-gray-700 dark:text-gray-300">{{ formatDate(invoice.created_at) }}</p>
          </div>
        </div>
        <div v-if="invoice.notes" class="mt-4 rounded border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800">
          <p class="text-xs text-gray-500 dark:text-gray-400">Catatan</p>
          <p class="mt-1 text-sm text-gray-700 dark:text-gray-300">{{ invoice.notes }}</p>
        </div>
      </div>

      <div class="mb-6 rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700/50 dark:bg-gray-900">
        <h2 class="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">Riwayat Pembayaran</h2>
        <div v-if="payments.length === 0" class="py-6 text-center text-sm text-gray-400 dark:text-gray-500">
          Belum ada pembayaran
        </div>
        <div v-else class="space-y-3">
          <div
            v-for="payment in payments"
            :key="payment.id"
            class="flex items-center justify-between rounded border border-gray-200 p-3 dark:border-gray-700"
          >
            <div>
              <p class="text-sm font-medium text-gray-900 dark:text-gray-100">{{ payment.payment_number }}</p>
              <p class="text-xs text-gray-500 dark:text-gray-400">
                {{ formatDateShort(payment.payment_date) }} · {{ payment.method }}
              </p>
            </div>
            <div class="flex items-center gap-3">
              <span class="font-semibold tabular-nums text-gray-900 dark:text-gray-100">
                {{ formatRupiah(payment.amount) }}
              </span>
              <KeuanganStatusBadge :status="payment.status" type="payment" size="sm" />
            </div>
          </div>
        </div>
      </div>

      <div class="mb-6 rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700/50 dark:bg-gray-900">
        <div class="mb-4 flex items-center justify-between">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Penyesuaian</h2>
          <UButton
            v-if="canApplyAdjustment"
            size="xs"
            icon="i-lucide-plus"
            class="bg-teal-600 text-white hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-400"
            @click="adjustmentOpen = true"
          >
            Tambah Penyesuaian
          </UButton>
        </div>
        <div v-if="adjustments.length === 0" class="py-6 text-center text-sm text-gray-400 dark:text-gray-500">
          Belum ada penyesuaian
        </div>
        <div v-else class="space-y-3">
          <div
            v-for="adj in adjustments"
            :key="adj.id"
            class="flex items-center justify-between rounded border border-gray-200 p-3 dark:border-gray-700"
          >
            <div>
              <p class="text-sm font-medium capitalize text-gray-900 dark:text-gray-100">{{ adj.type }}</p>
              <p class="text-xs text-gray-500 dark:text-gray-400">
                {{ adj.description || '-' }} · {{ formatDateShort(adj.applied_at) }}
              </p>
            </div>
            <div class="text-right">
              <span v-if="adj.percentage" class="text-sm text-gray-500 dark:text-gray-400">{{ adj.percentage }}%</span>
              <p class="font-semibold tabular-nums text-gray-900 dark:text-gray-100">
                {{ formatRupiah(adj.amount) }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div v-if="canApplyAdjustment || canCancel" class="flex flex-wrap gap-2">
        <UButton
          v-if="canCancel"
          color="error"
          variant="outline"
          icon="i-lucide-x-circle"
          @click="cancelOpen = true"
        >
          Batalkan Tagihan
        </UButton>
      </div>
    </template>

    <AdminKeuanganAdminAdjustmentFormModal
      v-model:open="adjustmentOpen"
      :invoice-id="invoiceId"
      @success="load"
    />

    <AdminConfirmActionModal
      v-model:open="cancelOpen"
      title="Batalkan Tagihan"
      description="Tagihan yang dibatalkan tidak dapat dipulihkan. Lanjutkan?"
      confirm-label="Batalkan"
      color="error"
      :loading="isCancelling"
      @confirm="confirmCancel"
    />
  </div>
</template>
