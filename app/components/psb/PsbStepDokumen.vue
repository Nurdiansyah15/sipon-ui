<script setup lang="ts">
import { usePsbStore } from '~/stores/psb'

const emit = defineEmits<{ next: [], prev: [] }>()

const store = usePsbStore()

onMounted(async () => {
  await store.fetchDokumen()
})
</script>

<template>
  <div class="space-y-4">
    <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Upload Dokumen Pendaftaran</h3>
    <p class="text-sm text-gray-500">Upload dokumen pendukung pendaftaran. Format: JPG, PNG, atau PDF (maks 5MB).</p>

    <PsbDocumentUploader stage="pendaftaran" />

    <div class="flex justify-between pt-4">
      <UButton color="neutral" variant="ghost" @click="emit('prev')">Kembali</UButton>
      <UButton @click="emit('next')">Lanjut</UButton>
    </div>
  </div>
</template>
