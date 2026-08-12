<script setup lang="ts">
defineProps<{
  title?: string
  description?: string
}>()
</script>

<template>
  <div class="mx-auto max-w-7xl px-4 py-8">
    <div class="rounded-lg border border-dashed border-gray-300 p-10 text-center dark:border-gray-600">
      <UIcon name="i-lucide-calendar-range" class="mx-auto h-10 w-10 text-gray-400 dark:text-gray-500" />
      <h2 class="mt-3 text-lg font-semibold text-gray-900 dark:text-gray-100">{{ title ?? 'Pilih Periode Kerja' }}</h2>
      <p class="mx-auto mt-1 max-w-md text-sm text-gray-500 dark:text-gray-400">
        {{ description ?? 'Pilih periode akademik terlebih dahulu untuk mengelola data pada halaman ini.' }}
      </p>
      <UButton class="mt-4" color="primary" icon="i-lucide-calendar-range" to="/admin/akademik/operasional">
        Pilih Periode
      </UButton>
    </div>
  </div>
</template>
