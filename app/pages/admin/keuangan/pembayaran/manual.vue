<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import { useKeuanganStore } from '~/stores/keuangan'
import { usePermission } from '~/composables/usePermission'
import type { PaymentMethod } from '#shared/types/Keuangan'

definePageMeta({ layout: 'keuangan' })

const store = useKeuanganStore()
const toast = useToast()
const { can } = usePermission()

const schema = z.object({
  invoice_id: z.string().min(1, 'Invoice wajib dipilih'),
  debit_account_id: z.string().optional(),
  amount: z.number().min(1, 'Jumlah wajib diisi'),
  method: z.enum(['transfer', 'cash', 'check'] as const),
  reference_number: z.string().optional(),
  payment_date: z.string().min(1, 'Tanggal pembayaran wajib diisi'),
  notes: z.string().optional(),
})
type Schema = z.output<typeof schema>

const state = reactive<Partial<Schema>>({
  invoice_id: '',
  debit_account_id: '',
  amount: undefined,
  method: 'transfer' as PaymentMethod,
  reference_number: '',
  payment_date: '',
  notes: '',
})

const methodOptions = [
  { label: 'Transfer', value: 'transfer' },
  { label: 'Tunai', value: 'cash' },
  { label: 'Cek', value: 'check' },
]

const selectedInvoice = computed(() => {
  if (!state.invoice_id) return null
  return store.invoices.find((inv) => inv.id === state.invoice_id) ?? null
})

watch(
  () => selectedInvoice.value,
  (inv) => {
    if (inv) {
      const remaining = inv.amount - inv.discount_amount - inv.paid_amount
      state.amount = remaining > 0 ? remaining : inv.amount
    }
  },
)

onMounted(async () => {
  try {
    await store.fetchInvoices({ limit: 100 })
  } catch {
    /* error in store */
  }
})

const invoiceOptions = computed(() =>
  store.invoices
    .filter((inv) => inv.status === 'issued' || inv.status === 'partial')
    .map((inv) => ({
      label: `${inv.invoice_number} - ${inv.fee_component?.name ?? inv.fee_component_id} (Sisa: ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(inv.amount - inv.discount_amount - inv.paid_amount).replace('Rp', 'Rp ')})`,
      value: inv.id,
    })),
)

async function onSubmit(event: FormSubmitEvent<Schema>) {
  try {
    await store.createManualPayment({
      invoice_id: event.data.invoice_id,
      debit_account_id: event.data.debit_account_id || undefined,
      amount: event.data.amount,
      method: event.data.method,
      reference_number: event.data.reference_number || undefined,
      payment_date: event.data.payment_date,
      notes: event.data.notes || undefined,
    })
    toast.add({ title: 'Pembayaran berhasil dibuat', color: 'success' })
    navigateTo('/admin/keuangan/pembayaran')
  } catch {
    toast.add({
      title: 'Gagal membuat pembayaran',
      description: store.error ?? undefined,
      color: 'error',
    })
  }
}
</script>

<template>
  <div class="mx-auto max-w-3xl px-4 py-8">
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
      <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Input Pembayaran Manual</h1>
      <p class="mt-1 text-sm text-gray-700 dark:text-gray-300">
        Catat pembayaran yang diterima secara manual.
      </p>
    </div>

    <div class="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700/50 dark:bg-gray-900">
      <UForm
        :schema="schema"
        :state="state"
        class="space-y-4"
        @submit="onSubmit"
      >
        <UFormField label="Invoice" name="invoice_id" required>
          <USelect
            v-model="state.invoice_id"
            :items="invoiceOptions"
            placeholder="Pilih invoice"
            class="w-full"
            :ui="{ base: 'bg-gray-50 dark:bg-gray-800', value: 'text-gray-900 dark:text-gray-100' }"
          />
        </UFormField>

        <KeuanganAccountPicker
          v-model="state.debit_account_id"
          label="Akun Debit (Kas/Bank)"
          placeholder="Pilih akun kas/bank"
          :filter="'asset'"
        />

        <UFormField label="Jumlah (Rp)" name="amount" required>
          <UInput
            v-model="state.amount"
            type="number"
            class="w-full"
            variant="subtle"
            placeholder="0"
          />
        </UFormField>

        <UFormField label="Metode Pembayaran" name="method" required>
          <USelect
            v-model="state.method"
            :items="methodOptions"
            class="w-full"
            :ui="{ base: 'bg-gray-50 dark:bg-gray-800', value: 'text-gray-900 dark:text-gray-100' }"
          />
        </UFormField>

        <UFormField label="No. Referensi" name="reference_number">
          <UInput
            v-model="state.reference_number"
            class="w-full"
            variant="subtle"
            placeholder="No. transaksi / bukti transfer"
          />
        </UFormField>

        <UFormField label="Tanggal Pembayaran" name="payment_date" required>
          <UInput
            v-model="state.payment_date"
            type="date"
            class="w-full"
            variant="subtle"
          />
        </UFormField>

        <UFormField label="Catatan" name="notes">
          <UTextarea v-model="state.notes" class="w-full" variant="subtle" placeholder="Opsional" :rows="2" />
        </UFormField>

        <div class="flex justify-end gap-2 pt-2">
          <UButton
            color="neutral"
            variant="ghost"
            type="button"
            @click="navigateTo('/admin/keuangan/pembayaran')"
          >
            Batal
          </UButton>
          <UButton
            type="submit"
            :loading="store.isSubmitting"
            icon="i-lucide-check"
            class="bg-teal-600 text-white hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-400"
          >
            Simpan Pembayaran
          </UButton>
        </div>
      </UForm>
    </div>
  </div>
</template>
