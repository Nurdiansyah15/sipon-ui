<script setup lang="ts">
import type { UpsertFormulirRequest } from '#shared/types/Psb'
import { usePsbStore } from '~/stores/psb'
import { parseApiError } from '~/utils/errorParser'

const props = defineProps<{
  form: UpsertFormulirRequest
  saving: boolean
}>()

const emit = defineEmits<{ save: [], prev: [] }>()

const store = usePsbStore()
const toast = useToast()

const previewing = ref<Record<string, boolean>>({})

const dokumenPendaftaran = computed(() =>
  store.dokumen.filter(d => d.stage === 'pendaftaran')
)

const pendingDocs = computed(() =>
  store.pendingDokumenList.filter(d => d.stage === 'pendaftaran')
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

async function previewConfirmedDoc(id: string) {
  previewing.value[id] = true
  try {
    const res = await store.requestDokumenAccess(id)
    window.open(res.access_url, '_blank')
  } catch (err) {
    toast.add({ title: 'Gagal membuka dokumen', description: parseApiError(err, 'Terjadi kesalahan'), color: 'error' })
  } finally {
    previewing.value[id] = false
  }
}

function previewPendingDoc(kind: string) {
  const entry = store.pendingDokumen[`pendaftaran:${kind}`]
  if (entry) window.open(entry.previewUrl, '_blank')
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
          <p class="text-sm text-gray-500">Periksa kembali seluruh data sebelum menyimpan.</p>
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
          <h3 class="font-semibold text-gray-900 dark:text-gray-100">Dokumen</h3>
          <p class="text-sm text-gray-500">Dokumen yang akan disimpan bersamaan dengan formulir.</p>
        </div>
      </div>

      <div v-if="dokumenPendaftaran.length === 0 && pendingDocs.length === 0" class="rounded-md bg-gray-50 p-4 text-center text-sm text-gray-400 dark:bg-gray-800">
        Belum ada dokumen diupload. Silakan kembali ke tahap Dokumen.
      </div>

      <div v-else class="grid gap-3 sm:grid-cols-2">
        <div
          v-for="doc in dokumenPendaftaran"
          :key="doc.id"
          class="flex items-center justify-between gap-3 rounded-lg border border-gray-200 p-3 dark:border-gray-700/50"
        >
          <div class="flex min-w-0 items-center gap-3">
            <UIcon name="i-lucide-file-text" class="h-5 w-5 shrink-0 text-gray-400" />
            <div class="min-w-0">
              <p class="truncate text-sm font-medium text-gray-900 dark:text-gray-100">{{ kindLabel[doc.kind] ?? doc.kind }}</p>
              <p class="truncate text-xs text-gray-400">{{ doc.original_filename }}</p>
            </div>
          </div>
          <div class="flex shrink-0 items-center gap-2">
            <UButton variant="ghost" size="xs" icon="i-lucide-eye" :loading="previewing[doc.id]" @click="previewConfirmedDoc(doc.id)">
              Lihat
            </UButton>
            <UBadge :color="statusColor(doc.status)" variant="subtle" size="xs">
              {{ statusLabel(doc.status) }}
            </UBadge>
          </div>
        </div>
        <div
          v-for="item in pendingDocs"
          :key="item.kind"
          class="flex items-center justify-between gap-3 rounded-lg border border-dashed border-blue-200 bg-blue-50/50 p-3 dark:border-blue-800 dark:bg-blue-950/30"
        >
          <div class="flex min-w-0 items-center gap-3">
            <UIcon name="i-lucide-file-text" class="h-5 w-5 shrink-0 text-blue-400" />
            <div class="min-w-0">
              <p class="truncate text-sm font-medium text-gray-900 dark:text-gray-100">{{ kindLabel[item.kind] ?? item.kind }}</p>
              <p class="text-xs text-blue-500">Siap disimpan</p>
            </div>
          </div>
          <div class="flex shrink-0 items-center gap-2">
            <UButton variant="ghost" size="xs" icon="i-lucide-eye" @click="previewPendingDoc(item.kind)">
              Lihat
            </UButton>
            <UBadge color="info" variant="subtle" size="xs">
              Baru
            </UBadge>
          </div>
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
