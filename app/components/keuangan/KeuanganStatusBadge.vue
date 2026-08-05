<script setup lang="ts">
import type { InvoiceStatus, PaymentStatus, PeriodStatus, JournalStatus } from '#shared/types/Keuangan'

type StatusType = 'invoice' | 'payment' | 'period' | 'journal'
type StatusValue = InvoiceStatus | PaymentStatus | PeriodStatus | JournalStatus

const props = defineProps<{
  status: StatusValue
  type: StatusType
  size?: 'xs' | 'sm' | 'md'
}>()

const invoiceColorMap: Record<InvoiceStatus, string> = {
  draft: 'neutral',
  issued: 'info',
  partial: 'warning',
  paid: 'success',
  expired: 'error',
  cancelled: 'neutral',
}

const paymentColorMap: Record<PaymentStatus, string> = {
  pending: 'warning',
  verified: 'success',
  rejected: 'error',
}

const periodColorMap: Record<PeriodStatus, string> = {
  open: 'success',
  closing: 'warning',
  closed: 'neutral',
  locked: 'error',
}

const journalColorMap: Record<JournalStatus, string> = {
  draft: 'neutral',
  posted: 'success',
  cancelled: 'error',
}

const invoiceLabelMap: Record<InvoiceStatus, string> = {
  draft: 'Draft',
  issued: 'Diterbitkan',
  partial: 'Sebagian',
  paid: 'Lunas',
  expired: 'Kadaluarsa',
  cancelled: 'Dibatalkan',
}

const paymentLabelMap: Record<PaymentStatus, string> = {
  pending: 'Menunggu',
  verified: 'Terverifikasi',
  rejected: 'Ditolak',
}

const periodLabelMap: Record<PeriodStatus, string> = {
  open: 'Buka',
  closing: 'Menutup',
  closed: 'Tutup',
  locked: 'Kunci',
}

const journalLabelMap: Record<JournalStatus, string> = {
  draft: 'Draft',
  posted: 'Diposting',
  cancelled: 'Dibatalkan',
}

const color = computed(() => {
  if (props.type === 'invoice') return invoiceColorMap[props.status as InvoiceStatus]
  if (props.type === 'payment') return paymentColorMap[props.status as PaymentStatus]
  if (props.type === 'period') return periodColorMap[props.status as PeriodStatus]
  return journalColorMap[props.status as JournalStatus]
})

const label = computed(() => {
  if (props.type === 'invoice') return invoiceLabelMap[props.status as InvoiceStatus]
  if (props.type === 'payment') return paymentLabelMap[props.status as PaymentStatus]
  if (props.type === 'period') return periodLabelMap[props.status as PeriodStatus]
  return journalLabelMap[props.status as JournalStatus]
})
</script>

<template>
  <UBadge :color="color" variant="subtle" :size="props.size ?? 'md'">
    {{ label }}
  </UBadge>
</template>
