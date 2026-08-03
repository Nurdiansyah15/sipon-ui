<script setup lang="ts">
defineProps<{
  loading?: boolean
}>()

const emit = defineEmits<{ next: [], prev: [] }>()
</script>

<template>
  <div class="space-y-6">

    <div class="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700/50 dark:bg-gray-900">
      <div class="mb-5 flex items-center gap-3">
        <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-50 dark:bg-teal-950">
          <UIcon name="i-lucide-file-text" class="h-5 w-5 text-teal-600 dark:text-teal-400" />
        </div>
        <div>
          <h3 class="font-semibold text-gray-900 dark:text-gray-100">Upload Dokumen Pendaftaran</h3>
          <p class="text-sm text-gray-500">Upload dokumen pendukung pendaftaran. Format: JPG, PNG, atau PDF (maks 5MB).</p>
        </div>
      </div>

      <div v-if="loading" class="flex items-center justify-center py-8">
        <UIcon name="i-lucide-loader-circle" class="h-6 w-6 animate-spin text-gray-400" />
        <span class="ml-2 text-sm text-gray-400">Memuat dokumen...</span>
      </div>

      <PsbDocumentUploader v-else stage="pendaftaran" />
    </div>

    <div class="flex justify-between">
      <UButton color="neutral" variant="ghost" leading-icon="i-lucide-arrow-left" @click="emit('prev')">Kembali</UButton>
      <UButton trailing-icon="i-lucide-arrow-right" @click="emit('next')">Lanjut</UButton>
    </div>

  </div>
</template>
