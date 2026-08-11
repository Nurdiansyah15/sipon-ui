<script setup lang="ts">
withDefaults(
  defineProps<{
    startTime: string
    endTime: string
  }>(),
  {},
)

function fmt(v: string) {
  if (!v) return '-'
  // "19:30:00" → "19:30"
  return v.length >= 5 ? v.slice(0, 5) : v
}
</script>

<template>
  <span class="text-sm text-gray-700 dark:text-gray-300">
    {{ fmt(startTime) }} – {{ fmt(endTime) }}
  </span>
</template>
