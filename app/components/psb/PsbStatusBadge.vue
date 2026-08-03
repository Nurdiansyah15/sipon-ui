<script setup lang="ts">
import type { PendaftarStatus } from '#shared/types/Psb'

const props = defineProps<{
  status: PendaftarStatus
  size?: 'sm' | 'md'
}>()

const colorMap: Record<PendaftarStatus, string> = {
  draft: 'neutral',
  diajukan: 'info',
  perlu_revisi: 'warning',
  ditolak: 'error',
  diterima: 'success',
  mengundurkan_diri: 'warning',
  daftar_ulang: 'primary',
  perlu_revisi_daftar_ulang: 'warning',
  selesai: 'success',
}

const labelMap: Record<PendaftarStatus, string> = {
  draft: 'Draft',
  diajukan: 'Diajukan',
  perlu_revisi: 'Perlu Revisi',
  ditolak: 'Ditolak',
  diterima: 'Diterima',
  mengundurkan_diri: 'Mengundurkan Diri',
  daftar_ulang: 'Daftar Ulang',
  perlu_revisi_daftar_ulang: 'Perlu Revisi Daftar Ulang',
  selesai: 'Selesai',
}
</script>

<template>
  <UBadge :color="colorMap[props.status]" :variant="props.status === 'selesai' ? 'solid' : 'subtle'" :size="props.size ?? 'md'">
    {{ labelMap[props.status] }}
  </UBadge>
</template>
