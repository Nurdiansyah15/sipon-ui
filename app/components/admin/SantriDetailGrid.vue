<script setup lang="ts">
interface Field {
  label: string
  value?: string | null
}

defineProps<{
  fields: Field[]
}>()
</script>

<template>
  <dl class="grid grid-cols-1 gap-x-6 gap-y-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
    <div v-for="f in fields" :key="f.label">
      <dt class="text-xs font-medium text-gray-500 dark:text-gray-400">{{ f.label }}</dt>
      <dd class="mt-0.5 text-sm text-gray-900 dark:text-gray-100">{{ f.value || '-' }}</dd>
    </div>
  </dl>
</template>
