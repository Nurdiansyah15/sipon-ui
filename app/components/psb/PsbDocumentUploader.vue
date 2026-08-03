<script setup lang="ts">
import type { DokumenStage, DokumenKind, DokumenItemResponse } from '#shared/types/Psb'
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

function docByKind(kind: DokumenKind): DokumenItemResponse | undefined {
  return store.dokumen.find(d => d.stage === props.stage && d.kind === kind)
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

    await store.confirmDokumen({ stage: props.stage, kind, key })
    await store.fetchDokumen()
    toast.add({ title: `${kindLabel[kind]} berhasil diupload`, color: 'success' })
  } catch (err) {
    toast.add({ title: 'Gagal upload', description: parseApiError(err, 'Terjadi kesalahan'), color: 'error' })
  } finally {
    uploading.value[kind] = false
  }
}

async function removeDoc(id: string) {
  deleting.value[id] = true
  try {
    await store.deleteDokumen(id)
    await store.fetchDokumen()
    toast.add({ title: 'Dokumen berhasil dihapus', color: 'success' })
  } catch (err) {
    toast.add({ title: 'Gagal menghapus', description: parseApiError(err, 'Terjadi kesalahan'), color: 'error' })
  } finally {
    deleting.value[id] = false
  }
}

function statusColor(status: string): string {
  return status === 'verified' ? 'success' : status === 'rejected' ? 'error' : 'neutral'
}
</script>

<template>
  <div class="space-y-3">
    <div v-for="kind in kinds" :key="kind" class="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <UIcon name="i-lucide-file-text" class="h-5 w-5 text-gray-400" />
          <div>
            <p class="text-sm font-medium text-gray-900 dark:text-gray-100">{{ kindLabel[kind] }}</p>
            <UBadge v-if="docByKind(kind)" :color="statusColor(docByKind(kind)!.status)" variant="subtle" size="xs" class="mt-1">
              {{ docByKind(kind)!.status === 'verified' ? 'Diverifikasi' : docByKind(kind)!.status === 'rejected' ? 'Ditolak' : 'Menunggu' }}
            </UBadge>
            <p v-else class="text-xs text-gray-400">Belum diupload</p>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <UButton
            v-if="docByKind(kind)"
            variant="ghost"
            size="xs"
            color="error"
            icon="i-lucide-trash-2"
            :loading="deleting[docByKind(kind)!.id]"
            :disabled="readonly"
            @click="removeDoc(docByKind(kind)!.id)"
          />
          <UButton
            variant="soft"
            size="xs"
            :loading="uploading[kind]"
            :disabled="readonly"
            @click="selectFile(kind)"
          >
            {{ docByKind(kind) ? 'Upload Ulang' : 'Upload' }}
          </UButton>
        </div>
      </div>

      <p v-if="docByKind(kind)?.notes" class="mt-2 text-xs text-red-500">{{ docByKind(kind)!.notes }}</p>

      <input
        :ref="(el: any) => fileInputs[kind] = el"
        type="file"
        :accept="ALLOWED_EXT"
        class="hidden"
        @change="handleFileSelect(kind, $event)"
      />
    </div>

    <p class="text-xs text-gray-400">JPG, PNG, PDF — Maks 5MB</p>
  </div>
</template>
