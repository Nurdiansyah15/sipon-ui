<script setup lang="ts">
definePageMeta({ layout: 'default' })
</script>

<template>
  <div class="mx-auto max-w-7xl px-4 py-8">
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Aplikasi</h1>
      <p class="mt-1 text-sm text-gray-500">Semua modul dan fitur yang tersedia.</p>
    </div>
    <FeatureModuleGrid />
  </div>
</template>
