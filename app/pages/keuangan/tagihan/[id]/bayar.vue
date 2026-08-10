<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import { useKeuanganStore } from '~/stores/keuangan'
import { parseApiError } from '~/utils/errorParser'
import type { Invoice } from '#shared/types/Keuangan'

definePageMeta({ layout: 'default' })

const route = useRoute()
const router = useRouter()
const keuanganStore = useKeuanganStore()
const toast = useToast()

const invoiceId = route.params.id as string
const invoice = ref<Invoice | null>(null)
const isLoaded = ref(false)

const outstandingAmount = computed(() => {
  if (!invoice.value) return 0
  return Math.max(0, invoice.value.amount - invoice.value.discount_amount - invoice.value.paid_amount)
})

const today = new Date().toISOString().slice(0, 10)

const schema = z.object({
  amount: z.number().min(1, 'Nominal harus lebih dari 0'),
  reference_number: z.string().min(1, 'Nomor referensi wajib diisi'),
  payment_date: z.string().min(1, 'Tanggal pembayaran wajib diisi'),
  proof_key: z.string().min(1, 'Bukti transfer wajib diupload'),
  notes: z.string().optional(),
})
type Schema = z.output<typeof schema>

const state = reactive<Partial<Schema>>({
  amount: undefined,
  reference_number: '',
  payment_date: today,
  proof_key: '',
  notes: '',
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

onMounted(async () => {
  try {
    invoice.value = await keuanganStore.fetchMyInvoice(invoiceId)
    state.amount = outstandingAmount.value
  } catch (err) {
    toast.add({ title: 'Gagal memuat tagihan', description: parseApiError(err), color: 'error' })
    router.push('/keuangan/tagihan')
  } finally {
    isLoaded.value = true
  }
})

async function onSubmit(event: FormSubmitEvent<Schema>) {
  try {
    await keuanganStore.submitPayment({
      invoice_id: invoiceId,
      amount: event.data.amount,
      method: 'transfer',
      reference_number: event.data.reference_number,
      payment_date: event.data.payment_date,
      proof_key: event.data.proof_key,
      notes: event.data.notes || undefined,
    })
    toast.add({
      title: 'Pembayaran berhasil diajukan',
      description: 'Pembayaran Anda sedang menunggu verifikasi admin.',
      color: 'success',
    })
    router.push(`/keuangan/tagihan/${invoiceId}`)
  } catch (err) {
    toast.add({ title: 'Gagal mengajukan pembayaran', description: parseApiError(err), color: 'error' })
  }
}
</script>

<template>
  <div class="mx-auto max-w-3xl px-4 py-8">
    <div class="mb-8 flex items-start justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Bayar Tagihan</h1>
        <p class="mt-1 text-sm text-gray-500">Lakukan pembayaran transfer dan unggah bukti transfer untuk diverifikasi admin.</p>
      </div>
      <UButton color="neutral" variant="ghost" icon="i-lucide-arrow-left" size="sm" class="shrink-0" @click="router.push(`/keuangan/tagihan/${invoiceId}`)">Kembali</UButton>
    </div>

    <div v-if="!isLoaded" class="space-y-4">
      <USkeleton class="h-64 w-full" />
    </div>

    <template v-else-if="invoice">
      <div class="mb-6 rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700/50 dark:bg-gray-900">
        <div class="mb-4 flex items-center justify-between">
          <div>
            <h3 class="font-semibold text-gray-900 dark:text-gray-100">{{ invoice.invoice_number }}</h3>
            <p class="text-sm text-gray-500">{{ invoice.fee_component?.name || '-' }} · {{ invoice.billing_period?.name ?? '-' }}</p>
          </div>
          <KeuanganStatusBadge :status="invoice.status" type="invoice" size="sm" />
        </div>
        <div class="space-y-2 border-t border-gray-200 pt-4 dark:border-gray-700">
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
            <span class="text-lg font-bold text-red-600 dark:text-red-400">{{ formatRupiah(outstandingAmount) }}</span>
          </div>
          <p class="text-xs text-gray-400">Jatuh tempo: {{ formatDate(invoice.due_date) }}</p>
        </div>
      </div>

      <div class="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700/50 dark:bg-gray-900">
        <UForm :schema="schema" :state="state" class="space-y-5" @submit="onSubmit">
          <UFormField label="Nominal Pembayaran" name="amount" hint="Maksimal sisa tagihan">
            <UInput v-model="state.amount" type="number" min="1" :max="outstandingAmount" class="w-full" />
          </UFormField>

          <UFormField label="Nomor Referensi Transfer" name="reference_number">
            <UInput v-model="state.reference_number" placeholder="Contoh: TRX1234567890" class="w-full" />
          </UFormField>

          <UFormField label="Tanggal Pembayaran" name="payment_date">
            <UInput v-model="state.payment_date" type="date" class="w-full" />
          </UFormField>

          <UFormField label="Bukti Transfer" name="proof_key" hint="Wajib diisi">
            <KeuanganPaymentProofUploader v-model="state.proof_key" />
          </UFormField>

          <UFormField label="Catatan (Opsional)" name="notes">
            <UTextarea v-model="state.notes" placeholder="Catatan tambahan untuk admin" class="w-full" />
          </UFormField>

          <div class="flex justify-end gap-2 border-t border-gray-200 pt-4 dark:border-gray-700">
            <UButton color="neutral" variant="ghost" @click="router.push(`/keuangan/tagihan/${invoiceId}`)">Batal</UButton>
            <UButton
              type="submit"
              :loading="keuanganStore.isSubmitting"
              icon="i-lucide-send"
              class="bg-teal-600 text-white hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-400"
            >
              Ajukan Pembayaran
            </UButton>
          </div>
        </UForm>
      </div>
    </template>

    <div v-else class="rounded-lg border border-gray-200 bg-white p-8 text-center dark:border-gray-700/50 dark:bg-gray-900">
      <UIcon name="i-lucide-file-x" class="mx-auto mb-3 h-12 w-12 text-gray-300" />
      <p class="text-gray-500 dark:text-gray-400">Tagihan tidak ditemukan.</p>
    </div>
  </div>
</template>
