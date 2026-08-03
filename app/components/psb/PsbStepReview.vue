<script setup lang="ts">
import type { UpsertFormulirRequest } from '#shared/types/Psb'
import { usePsbStore } from '~/stores/psb'

const props = defineProps<{
  form: UpsertFormulirRequest
  saving: boolean
}>()

const emit = defineEmits<{ save: [], prev: [] }>()

const store = usePsbStore()
</script>

<template>
  <div class="space-y-6">
    <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Review & Submit</h3>
    <p class="text-sm text-gray-500">Periksa kembali data Anda sebelum mengajukan pendaftaran.</p>

    <PsbProfileSummary :profile="props.form" />

    <UDivider />

    <div>
      <h4 class="mb-3 font-semibold text-gray-700 dark:text-gray-300">Dokumen Diupload</h4>
      <div v-if="store.dokumen.filter(d => d.stage === 'pendaftaran').length === 0" class="text-sm text-gray-400">
        Belum ada dokumen diupload.
      </div>
      <div v-else class="space-y-2">
        <div v-for="doc in store.dokumen.filter(d => d.stage === 'pendaftaran')" :key="doc.id" class="flex items-center justify-between rounded-lg border border-gray-200 p-2 dark:border-gray-700">
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-file-text" class="h-4 w-4 text-gray-400" />
            <span class="text-sm text-gray-900 dark:text-gray-100">{{ doc.kind }}</span>
          </div>
          <UBadge :color="doc.status === 'verified' ? 'success' : doc.status === 'rejected' ? 'error' : 'neutral'" variant="subtle" size="xs">
            {{ doc.status === 'verified' ? 'OK' : doc.status === 'rejected' ? 'Ditolak' : 'Pending' }}
          </UBadge>
        </div>
      </div>
    </div>

    <div class="flex justify-between pt-4">
      <UButton color="neutral" variant="ghost" @click="emit('prev')">Kembali</UButton>
      <UButton color="primary" :loading="props.saving" @click="emit('save')">
        Simpan & Lanjut Submit
      </UButton>
    </div>
  </div>
</template>
