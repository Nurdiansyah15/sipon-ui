<script setup lang="ts">
const props = defineProps<{
  amount: number
  showLabel?: boolean
  variant?: 'debit' | 'credit' | 'neutral'
}>()

function formatRupiah(value: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value).replace('Rp', 'Rp ')
}

const formattedAmount = computed(() => formatRupiah(props.amount))

const textColor = computed(() => {
  if (props.variant === 'debit') return 'text-red-600 dark:text-red-400'
  if (props.variant === 'credit') return 'text-green-600 dark:text-green-400'
  return 'text-gray-900 dark:text-gray-100'
})
</script>

<template>
  <div class="flex items-baseline gap-1">
    <span v-if="showLabel" class="text-xs text-gray-500 dark:text-gray-400">Jumlah:</span>
    <span :class="['font-semibold tabular-nums', textColor]">
      {{ formattedAmount }}
    </span>
  </div>
</template>
