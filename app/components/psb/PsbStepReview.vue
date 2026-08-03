<script setup lang="ts">
import type { UpsertFormulirRequest } from '#shared/types/Psb'
import { usePsbStore } from '~/stores/psb'

const props = defineProps<{
  form: UpsertFormulirRequest
  saving: boolean
}>()

const emit = defineEmits<{ save: [], prev: [] }>()

const store = usePsbStore()

const dokumenPendaftaran = computed(() =>
  store.dokumen.filter(d => d.stage === 'pendaftaran')
)

const kindLabel: Record<string, string> = {
  surat_pernyataan: 'Surat Pernyataan',
  ktp: 'KTP',
  kk: 'Kartu Keluarga',
  mutasi: 'Surat Mutasi',
  pembayaran: 'Bukti Pembayaran',
}

function statusLabel(status: string): string {
  return status === 'verified' ? 'Diverifikasi' : status === 'rejected' ? 'Ditolak' : 'Menunggu'
}

function statusColor(status: string): string {
  return status === 'verified' ? 'success' : status === 'rejected' ? 'error' : 'neutral'
}
</script>

<template>
  <div class="space-y-6">

    <div class="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700/50 dark:bg-gray-900">
      <div class="mb-5 flex items-center gap-3">
        <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-50 dark:bg-teal-950">
          <UIcon name="i-lucide-clipboard-check" class="h-5 w-5 text-teal-600 dark:text-teal-400" />
        </div>
        <div>
          <h3 class="font-semibold text-gray-900 dark:text-gray-100">Ringkasan Data</h3>
          <p class="text-sm text-gray-500">Periksa kembali seluruh data sebelum mengajukan.</p>
        </div>
      </div>

      <PsbProfileSummary :profile="props.form" />
    </div>

    <div class="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700/50 dark:bg-gray-900">
      <div class="mb-5 flex items-center gap-3">
        <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-50 dark:bg-teal-950">
          <UIcon name="i-lucide-file-text" class="h-5 w-5 text-teal-600 dark:text-teal-400" />
        </div>
        <div>
          <h3 class="font-semibold text-gray-900 dark:text-gray-100">Dokumen Diupload</h3>
          <p class="text-sm text-gray-500">Dokumen yang sudah diupload untuk pendaftaran.</p>
        </div>
      </div>

      <div v-if="dokumenPendaftaran.length === 0" class="rounded-md bg-gray-50 p-4 text-center text-sm text-gray-400 dark:bg-gray-800">
        Belum ada dokumen diupload. Silakan kembali ke tahap Dokumen.
      </div>

      <div v-else class="grid gap-3 sm:grid-cols-2">
        <div
          v-for="doc in dokumenPendaftaran"
          :key="doc.id"
          class="flex items-center justify-between rounded-lg border border-gray-200 p-3 dark:border-gray-700/50"
        >
          <div class="flex items-center gap-3">
            <UIcon name="i-lucide-file-text" class="h-5 w-5 text-gray-400" />
            <div>
              <p class="text-sm font-medium text-gray-900 dark:text-gray-100">{{ kindLabel[doc.kind] ?? doc.kind }}</p>
              <p class="text-xs text-gray-400">{{ doc.original_filename }}</p>
            </div>
          </div>
          <UBadge :color="statusColor(doc.status)" variant="subtle" size="xs">
            {{ statusLabel(doc.status) }}
          </UBadge>
        </div>
      </div>
    </div>

    <div class="flex justify-between">
      <UButton color="neutral" variant="ghost" leading-icon="i-lucide-arrow-left" @click="emit('prev')">Kembali</UButton>
      <UButton :loading="props.saving" size="md" color="primary" icon="i-lucide-save" @click="emit('save')">
        Simpan & Selesai
      </UButton>
    </div>

  </div>
</template>
