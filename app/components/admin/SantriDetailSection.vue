<script setup lang="ts">
defineProps<{
  title: string
}>()
</script>

<template>
  <div class="mb-6">
    <h4 class="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
      {{ title }}
    </h4>
    <div class="rounded-lg border border-gray-200 dark:border-gray-700/50">
      <slot />
    </div>
  </div>
</template>
