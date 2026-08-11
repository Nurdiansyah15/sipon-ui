<script setup lang="ts">
import type { DokumenStage, DokumenItemResponse } from '#shared/types/Psb'
import type { DokumenKind } from '#shared/types/Dokumen'
import { usePsbStore } from '~/stores/psb'
import { parseApiError } from '~/utils/errorParser'

const props = defineProps<{
  stage: DokumenStage
  readonly?: boolean
}>()

const store = usePsbStore()
const toast = useToast()

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'application/pdf']
const ALLOWED_EXT = '.jpg,.jpeg,.png,.pdf'
const MAX_SIZE = 5 * 1024 * 1024

const kindLabel: Record<DokumenKind, string> = {
  surat_pernyataan: 'Surat Pernyataan',
  ktp: 'KTP',
  kk: 'Kartu Keluarga',
  mutasi: 'Surat Mutasi',
  pembayaran: 'Bukti Pembayaran',
}

const kinds: DokumenKind[] = ['surat_pernyataan', 'ktp', 'kk', 'mutasi', 'pembayaran']

const uploading = ref<Record<string, boolean>>({})
const deleting = ref<Record<string, boolean>>({})
const previewing = ref<Record<string, boolean>>({})

type LocalDoc = Pick<DokumenItemResponse, 'kind' | 'stage' | 'status' | 'id' | 'original_filename' | 'notes' | 'size' | 'mime_type'> & { source: 'confirmed' | 'local'; previewUrl?: string }

function combinedDoc(kind: DokumenKind): LocalDoc | undefined {
  const confirmed = store.dokumen.find(d => d.stage === props.stage && d.kind === kind)
  const pending = store.pendingDokumen[`${props.stage}:${kind}`]

  if (pending) {
    return {
      kind,
      stage: props.stage,
      status: confirmed?.status ?? 'pending' as any,
      id: confirmed?.id ?? '',
      source: 'local',
      original_filename: pending.filename,
      notes: null,
      size: null,
      mime_type: null,
      previewUrl: pending.previewUrl,
    }
  }

  if (confirmed) {
    return { source: 'confirmed', ...confirmed }
  }

  return undefined
}

const fileInputs = ref<Record<string, HTMLInputElement | null>>({})

function selectFile(kind: DokumenKind) {
  fileInputs.value[kind]?.click()
}

async function handleFileSelect(kind: DokumenKind, event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  if (!ALLOWED_TYPES.includes(file.type)) {
    toast.add({ title: 'Format tidak didukung', description: 'Gunakan JPG, PNG, atau PDF', color: 'error' })
    return
  }
  if (file.size > MAX_SIZE) {
    toast.add({ title: 'File terlalu besar', description: 'Maksimal 5MB', color: 'error' })
    return
  }

  uploading.value[kind] = true
  try {
    const { presign_url, key } = await store.requestDokumenPresign({
      stage: props.stage,
      kind,
      filename: file.name,
      content_type: file.type,
    })

    const uploadRes = await fetch(presign_url, {
      method: 'PUT',
      body: file,
      headers: { 'Content-Type': file.type },
    })
    if (!uploadRes.ok) throw new Error(`Upload gagal: ${uploadRes.status}`)

    store.setPendingDokumen({ stage: props.stage, kind, key, filename: file.name, previewUrl: URL.createObjectURL(file) })
    toast.add({ title: `${kindLabel[kind]} siap disimpan`, color: 'success' })
  } catch (err) {
    toast.add({ title: 'Gagal upload', description: parseApiError(err, 'Terjadi kesalahan'), color: 'error' })
  } finally {
    uploading.value[kind] = false
    if (target) target.value = ''
  }
}

async function removeDoc(kind: DokumenKind) {
  const doc = combinedDoc(kind)
  if (!doc) return

  if (doc.source === 'local') {
    store.removePendingDokumen(props.stage, kind)
    toast.add({ title: 'File lokal dihapus', color: 'success' })
    return
  }

  deleting.value[doc.id] = true
  try {
    await store.deleteDokumen(doc.id)
    await store.fetchDokumen()
    toast.add({ title: 'Dokumen berhasil dihapus', color: 'success' })
  } catch (err) {
    toast.add({ title: 'Gagal menghapus', description: parseApiError(err, 'Terjadi kesalahan'), color: 'error' })
  } finally {
    deleting.value[doc.id] = false
  }
}

async function previewDoc(kind: DokumenKind) {
  const doc = combinedDoc(kind)
  if (!doc) return

  if (doc.source === 'local') {
    window.open(doc.previewUrl, '_blank')
    return
  }

  previewing.value[doc.id] = true
  try {
    const res = await store.requestDokumenAccess(doc.id)
    window.open(res.access_url, '_blank')
  } catch (err) {
    toast.add({ title: 'Gagal membuka dokumen', description: parseApiError(err, 'Terjadi kesalahan'), color: 'error' })
  } finally {
    previewing.value[doc.id] = false
  }
}

function statusColor(status: string): string {
  return status === 'verified' ? 'success' : status === 'rejected' ? 'error' : 'neutral'
}
</script>

<template>
  <div class="space-y-4">
    <div class="grid gap-3 sm:grid-cols-2">
      <div v-for="kind in kinds" :key="kind" class="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700/50 dark:bg-gray-900">
        <div class="flex items-center justify-between gap-3">
          <div class="flex min-w-0 items-center gap-3">
            <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-50 dark:bg-gray-800">
              <UIcon name="i-lucide-file-text" class="h-4.5 w-4.5 text-gray-400" />
            </div>
            <div class="min-w-0">
              <p class="truncate text-sm font-medium text-gray-900 dark:text-gray-100">{{ kindLabel[kind] }}</p>
              <template v-if="combinedDoc(kind)?.source === 'confirmed'">
                <UBadge :color="statusColor(combinedDoc(kind)!.status)" variant="subtle" size="xs" class="mt-1">
                  {{ combinedDoc(kind)!.status === 'verified' ? 'Diverifikasi' : combinedDoc(kind)!.status === 'rejected' ? 'Ditolak' : 'Menunggu' }}
                </UBadge>
              </template>
              <template v-else-if="combinedDoc(kind)?.source === 'local'">
                <UBadge color="info" variant="subtle" size="xs" class="mt-1">
                  Siap disimpan
                </UBadge>
              </template>
              <p v-else class="text-xs text-gray-400">Belum diupload</p>
            </div>
          </div>

          <div class="flex shrink-0 items-center gap-2">
            <UButton
              v-if="combinedDoc(kind)"
              variant="ghost"
              size="xs"
              icon="i-lucide-eye"
              :loading="previewing[combinedDoc(kind)!.id]"
              @click="previewDoc(kind)"
            >
              Lihat
            </UButton>
            <UButton
              v-if="combinedDoc(kind)"
              variant="ghost"
              size="xs"
              color="error"
              icon="i-lucide-trash-2"
              :loading="deleting[combinedDoc(kind)!.id]"
              :disabled="readonly"
              @click="removeDoc(kind)"
            />
            <UButton
              variant="soft"
              size="xs"
              :loading="uploading[kind]"
              :disabled="readonly"
              @click="selectFile(kind)"
            >
              {{ combinedDoc(kind) ? 'Ganti' : 'Upload' }}
            </UButton>
          </div>
        </div>

        <p v-if="combinedDoc(kind)?.notes" class="mt-2 text-xs text-red-500">{{ combinedDoc(kind)!.notes }}</p>

        <input
          :ref="(el: any) => fileInputs[kind] = el"
          type="file"
          :accept="ALLOWED_EXT"
          class="hidden"
          @change="handleFileSelect(kind, $event)"
        />
      </div>
    </div>

    <p class="text-xs text-gray-400">JPG, PNG, PDF — Maks 5MB. File akan disimpan bersamaan dengan formulir.</p>
  </div>
</template>
