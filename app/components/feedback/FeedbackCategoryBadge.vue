<script setup lang="ts">
import type { FeedbackCategory } from '#shared/types/Feedback'

const props = defineProps<{
  category: FeedbackCategory
  size?: 'sm' | 'md'
}>()

type BadgeColor = 'error' | 'success' | 'primary' | 'secondary' | 'info' | 'warning' | 'neutral'

const colorMap: Record<FeedbackCategory, BadgeColor> = {
  saran: 'info',
  pengaduan: 'error',
  pertanyaan: 'primary',
  apresiasi: 'success',
  lainnya: 'neutral',
}

const labelMap: Record<FeedbackCategory, string> = {
  saran: 'Saran',
  pengaduan: 'Pengaduan',
  pertanyaan: 'Pertanyaan',
  apresiasi: 'Apresiasi',
  lainnya: 'Lainnya',
}
</script>

<template>
  <UBadge :color="colorMap[props.category]" variant="subtle" :size="props.size ?? 'md'">
    {{ labelMap[props.category] }}
  </UBadge>
</template>
