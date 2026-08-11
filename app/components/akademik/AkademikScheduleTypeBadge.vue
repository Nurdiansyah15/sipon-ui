<script setup lang="ts">
import type { ActivityScheduleType } from '#shared/types/Akademik'

type BadgeColor = 'error' | 'success' | 'primary' | 'secondary' | 'info' | 'warning' | 'neutral'

const props = defineProps<{
  type: ActivityScheduleType
  size?: 'xs' | 'sm' | 'md'
}>()

const labelMap: Record<ActivityScheduleType, string> = {
  once: 'Sekali',
  daily: 'Harian',
  weekly: 'Mingguan',
  monthly: 'Bulanan',
  yearly: 'Tahunan',
}

const colorMap: Record<ActivityScheduleType, BadgeColor> = {
  once: 'neutral',
  daily: 'info',
  weekly: 'success',
  monthly: 'warning',
  yearly: 'error',
}
</script>

<template>
  <UBadge :color="colorMap[props.type] ?? 'neutral'" variant="outline" :size="props.size ?? 'sm'">
    {{ labelMap[props.type] ?? props.type }}
  </UBadge>
</template>
