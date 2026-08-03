<script setup lang="ts">
import { usePsbAdminStore } from '~/stores/psbAdmin'
import { parseApiError } from '~/utils/errorParser'
import type { DokumenItemResponse } from '#shared/types/Psb'

const props = defineProps<{
  pendaftarId: string
  dokumen: DokumenItemResponse[]
  loading: boolean
  readonly: boolean
}>()

const emit = defineEmits<{
  updated: []
}>()

const store = usePsbAdminStore()
const toast = useToast()

const previewing = ref<Record<string, boolean>>({})

const kindLabel: Record<string, string> = {
  surat_pernyataan: 'Surat Pernyataan',
  ktp: 'KTP',
  kk: 'Kartu Keluarga',
  mutasi: 'Surat Mutasi',
  pembayaran: 'Bukti Pembayaran',
}

const stageLabel: Record<string, string> = {
  pendaftaran: 'Pendaftaran',
  daftar_ulang: 'Daftar Ulang',
}

const grouped = computed(() => {
  const groups: Record<string, DokumenItemResponse[]> = {}
  for (const d of props.dokumen) {
    const key = d.stage
    if (!groups[key]) groups[key] = []
    groups[key].push(d)
  }
  return groups
})

async function previewDoc(dokumenID: string) {
  previewing.value[dokumenID] = true
  try {
    const res = await store.accessDokumen(props.pendaftarId, dokumenID)
    window.open(res.access_url, '_blank')
  } catch (err) {
    toast.add({ title: 'Gagal membuka dokumen', description: parseApiError(err), color: 'error' })
  } finally {
    previewing.value[dokumenID] = false
  }
}

async function verifyDoc(dokumenID: string) {
  try {
    await store.verifyDokumen(props.pendaftarId, dokumenID)
    toast.add({ title: 'Dokumen diverifikasi', color: 'success' })
    emit('updated')
  } catch (err) {
    toast.add({ title: 'Gagal', description: parseApiError(err), color: 'error' })
  }
}

async function rejectDoc(dokumenID: string) {
  try {
    const notes = prompt('Catatan penolakan (opsional):')
    await store.rejectDokumen(props.pendaftarId, dokumenID, notes || undefined)
    toast.add({ title: 'Dokumen ditolak', color: 'warning' })
    emit('updated')
  } catch (err) {
    toast.add({ title: 'Gagal', description: parseApiError(err), color: 'error' })
  }
}

function statusColor(s: string): string {
  return s === 'verified' ? 'success' : s === 'rejected' ? 'error' : 'neutral'
}
</script>

<template>
  <div class="space-y-6">
    <div v-if="loading" class="space-y-3">
      <USkeleton v-for="i in 4" :key="i" class="h-20 w-full" />
    </div>

    <div v-else-if="Object.keys(grouped).length === 0" class="py-8 text-center text-gray-500">
      Belum ada dokumen.
    </div>

    <div v-else v-for="(docs, stage) in grouped" :key="stage">
      <h4 class="mb-3 text-sm font-semibold text-gray-500 uppercase">{{ stageLabel[stage] || stage }}</h4>
      <div class="space-y-3">
        <div v-for="doc in docs" :key="doc.id" class="flex items-center justify-between rounded-lg border border-gray-200 p-3 dark:border-gray-700">
          <div class="flex items-center gap-3 min-w-0">
            <UIcon name="i-lucide-file-text" class="h-5 w-5 shrink-0 text-gray-400" />
            <div class="min-w-0">
              <p class="text-sm font-medium text-gray-900 dark:text-gray-100">{{ kindLabel[doc.kind] || doc.kind }}</p>
              <p v-if="doc.original_filename" class="text-xs text-gray-400 truncate">{{ doc.original_filename }}</p>
              <UBadge :color="statusColor(doc.status)" variant="subtle" size="xs" class="mt-1">
                {{ doc.status === 'verified' ? 'Diverifikasi' : doc.status === 'rejected' ? 'Ditolak' : 'Pending' }}
              </UBadge>
              <p v-if="doc.notes" class="mt-1 text-xs text-red-500">{{ doc.notes }}</p>
            </div>
          </div>

          <div class="flex shrink-0 gap-1">
            <UButton
              icon="i-lucide-eye"
              size="xs"
              variant="ghost"
              :loading="previewing[doc.id]"
              @click="previewDoc(doc.id)"
            />
            <template v-if="!readonly">
            <UButton
              v-if="doc.status !== 'verified'"
              icon="i-lucide-check"
              size="xs"
              color="success"
              variant="soft"
              @click="verifyDoc(doc.id)"
            />
            <UButton
              v-if="doc.status !== 'rejected'"
              icon="i-lucide-x"
              size="xs"
              color="error"
              variant="soft"
              @click="rejectDoc(doc.id)"
            />
            </template>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
