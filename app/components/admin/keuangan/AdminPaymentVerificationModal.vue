<script setup lang="ts">
const props = defineProps<{
  open: boolean
  payment: {
    id: string
    payment_number: string
    amount: number
    status: string
    invoice_number?: string
  } | null
}>()

const emit = defineEmits<{
  'update:open': [boolean]
  verified: []
  rejected: []
}>()

const store = useKeuanganStore()
const toast = useToast()

const isProcessing = ref(false)

function close() {
  if (isProcessing.value) return
  emit('update:open', false)
}

watch(
  () => props.open,
  (open) => {
    if (!open) isProcessing.value = false
  },
)

function formatRupiah(value: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value).replace('Rp', 'Rp ')
}

async function handleVerify() {
  if (!props.payment) return
  isProcessing.value = true
  try {
    await store.verifyPayment(props.payment.id)
    toast.add({ title: 'Pembayaran diverifikasi', color: 'success' })
    emit('verified')
    emit('update:open', false)
  } catch {
    toast.add({
      title: 'Gagal memverifikasi pembayaran',
      description: store.error ?? undefined,
      color: 'error',
    })
  } finally {
    isProcessing.value = false
  }
}

async function handleReject() {
  if (!props.payment) return
  isProcessing.value = true
  try {
    await store.rejectPayment(props.payment.id)
    toast.add({ title: 'Pembayaran ditolak', color: 'success' })
    emit('rejected')
    emit('update:open', false)
  } catch {
    toast.add({
      title: 'Gagal menolak pembayaran',
      description: store.error ?? undefined,
      color: 'error',
    })
  } finally {
    isProcessing.value = false
  }
}
</script>

<template>
  <UModal
    :open="open"
    :dismissible="!isProcessing"
    @update:open="(v: boolean) => emit('update:open', v)"
  >
    <template #content>
      <div class="p-6">
        <div class="mb-4 flex items-center justify-between">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Verifikasi Pembayaran</h3>
          <UButton
            color="neutral"
            variant="ghost"
            icon="i-lucide-x"
            size="sm"
            square
            :disabled="isProcessing"
            @click="close"
          />
        </div>

        <div v-if="payment" class="mb-6 space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
          <div class="flex justify-between text-sm">
            <span class="text-gray-500 dark:text-gray-400">No. Pembayaran</span>
            <span class="font-medium text-gray-900 dark:text-gray-100">{{ payment.payment_number }}</span>
          </div>
          <div v-if="payment.invoice_number" class="flex justify-between text-sm">
            <span class="text-gray-500 dark:text-gray-400">No. Invoice</span>
            <span class="font-medium text-gray-900 dark:text-gray-100">{{ payment.invoice_number }}</span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-gray-500 dark:text-gray-400">Jumlah</span>
            <span class="font-semibold text-gray-900 dark:text-gray-100">{{ formatRupiah(payment.amount) }}</span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-gray-500 dark:text-gray-400">Status</span>
            <KeuanganStatusBadge :status="payment.status" type="payment" size="sm" />
          </div>
        </div>

        <p class="mb-4 text-sm text-gray-600 dark:text-gray-400">
          Pilih tindakan untuk pembayaran ini.
        </p>

        <div class="flex justify-end gap-2 pt-2">
          <UButton color="neutral" variant="ghost" :disabled="isProcessing" @click="close">
            Batal
          </UButton>
          <UButton
            color="error"
            variant="outline"
            :loading="isProcessing"
            icon="i-lucide-x"
            @click="handleReject"
          >
            Tolak
          </UButton>
          <UButton
            color="success"
            :loading="isProcessing"
            icon="i-lucide-check"
            @click="handleVerify"
          >
            Verifikasi
          </UButton>
        </div>
      </div>
    </template>
  </UModal>
</template>
