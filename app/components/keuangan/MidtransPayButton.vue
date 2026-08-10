<script setup lang="ts">
import { useKeuanganStore } from '~/stores/keuangan'
import { useMidtransSnap } from '~/composables/useMidtransSnap'
import { parseApiError } from '~/utils/errorParser'
import type { PaymentGatewayStatus } from '#shared/types/Keuangan'

const props = withDefaults(defineProps<{
  invoiceId: string
  amount?: number
  payable?: boolean
  size?: 'sm' | 'md'
}>(), {
  amount: 0,
  payable: true,
  size: 'md',
})

const emit = defineEmits<{
  paid: []
  updated: []
  error: [message: string]
}>()

const keuanganStore = useKeuanganStore()
const { loadSnap, pay } = useMidtransSnap()
const toast = useToast()

const isProcessing = ref(false)
const isPolling = ref(false)

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function handlePay() {
  if (!props.payable || isProcessing.value) return
  isProcessing.value = true
  try {
    await loadSnap()
    const tx = await keuanganStore.createMidtransPayment(props.invoiceId)
    pay(tx.snap_token, {
      onSuccess: () => void startPolling(),
      onPending: () => void startPolling(),
      onError: () => {
        toast.add({ title: 'Pembayaran gagal', description: 'Transaksi tidak dapat diproses.', color: 'error' })
        isProcessing.value = false
        emit('updated')
      },
      onClose: () => {
        isProcessing.value = false
        void startPolling()
      },
    })
  } catch (err) {
    const msg = parseApiError(err, 'Gagal memulai pembayaran online.')
    toast.add({ title: 'Gagal memulai pembayaran', description: msg, color: 'error' })
    emit('error', msg)
    isProcessing.value = false
  }
}

// Setelah popup Snap ditutup, polling status pembayaran sampai server menerima
// notifikasi webhook dari Midtrans (atau sampai timeout).
async function startPolling() {
  if (isPolling.value) return
  isPolling.value = true
  try {
    for (let i = 0; i < 20; i++) {
      await sleep(3000)
      let status: PaymentGatewayStatus | null = null
      try {
        const st = await keuanganStore.fetchPaymentGatewayStatus(props.invoiceId)
        status = st.status
      } catch {
        // Transient error — lanjut polling.
      }
      if (status === 'settlement' || status === 'capture') {
        toast.add({ title: 'Pembayaran Berhasil', description: 'Pembayaran Anda telah diterima.', color: 'success' })
        emit('paid')
        return
      }
      if (status && ['deny', 'failure', 'expire', 'cancel'].includes(status)) {
        toast.add({
          title: 'Pembayaran Tidak Berhasil',
          description: 'Status transaksi: ' + status,
          color: 'error',
        })
        emit('updated')
        return
      }
    }
    emit('updated')
  } finally {
    isPolling.value = false
    isProcessing.value = false
  }
}

const buttonLoading = computed(() => isProcessing.value || isPolling.value)
</script>

<template>
  <UButton
    v-if="payable"
    color="primary"
    icon="i-lucide-credit-card"
    :size="props.size"
    :loading="buttonLoading"
    :disabled="buttonLoading"
    @click="handlePay"
  >
    {{ isProcessing ? 'Memproses…' : 'Bayar Online' }}
  </UButton>
</template>
