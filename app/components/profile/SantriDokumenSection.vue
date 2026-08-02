<script setup lang="ts">
import { useKesantrianStore } from '~/stores/kesantrian'
import { parseApiError } from '~/utils/errorParser'
import type { DokumenItem, DokumenKind } from '#shared/types/Kesantrian'

const store = useKesantrianStore()
const toast = useToast()

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'application/pdf']

const kinds: { key: DokumenKind, label: string }[] = [
  { key: 'surat_pernyataan', label: 'Surat Pernyataan' },
  { key: 'ktp', label: 'KTP' },
  { key: 'kk', label: 'Kartu Keluarga' },
  { key: 'mutasi', label: 'Surat Mutasi' },
  { key: 'pembayaran', label: 'Bukti Pembayaran' },
]

const isLoading = computed(() => store.isLoadingMyDokumen)
const uploadingKind = ref<DokumenKind | null>(null)
const deletingId = ref<string | null>(null)
const fileInputs = ref<Record<string, HTMLInputElement | undefined>>({})

async function load() {
  try {
    await store.fetchMyDokumen()
  } catch (err) {
    toast.add({
      title: 'Gagal memuat dokumen',
      description: store.error ?? undefined,
      color: 'error',
    })
  }
}

onMounted(load)

// Kalau kind yang sama pernah diunggah lebih dari sekali (mis. re-upload
// setelah ditolak), ambil yang paling baru.
function docFor(kind: DokumenKind): DokumenItem | undefined {
  const matches = store.myDokumen.filter((d) => d.kind === kind)
  if (matches.length === 0) return undefined
  return matches.reduce((latest, cur) => (cur.created_at > latest.created_at ? cur : latest))
}

function openFilePicker(kind: DokumenKind) {
  fileInputs.value[kind]?.click()
}

async function handleFileSelect(event: Event, kind: DokumenKind) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  target.value = ''
  if (!file) return

  if (!ALLOWED_TYPES.includes(file.type)) {
    toast.add({ title: 'Format tidak didukung', description: 'Gunakan JPG, PNG, atau PDF', color: 'error' })
    return
  }

  uploadingKind.value = kind
  try {
    const { presign_url, key } = await store.presignMyDokumen({ content_type: file.type, kind })

    const uploadRes = await fetch(presign_url, {
      method: 'PUT',
      body: file,
      headers: { 'Content-Type': file.type },
    })
    if (!uploadRes.ok) {
      throw new Error(`Upload gagal: ${uploadRes.status}`)
    }

    await store.confirmMyDokumen({
      kind,
      key,
      original_filename: file.name,
      mime_type: file.type,
      size: file.size,
    })

    toast.add({ title: 'Dokumen berhasil diunggah', color: 'success' })
    await load()
  } catch (err) {
    toast.add({
      title: 'Gagal mengunggah dokumen',
      description: parseApiError(err, 'Terjadi kesalahan'),
      color: 'error',
    })
  } finally {
    uploadingKind.value = null
  }
}

async function viewDokumen(doc: DokumenItem) {
  try {
    const res = await store.accessMyDokumen(doc.id)
    window.open(res.access_url, '_blank')
  } catch (err) {
    toast.add({
      title: 'Gagal membuka dokumen',
      description: store.error ?? undefined,
      color: 'error',
    })
  }
}

async function deleteDokumen(doc: DokumenItem) {
  deletingId.value = doc.id
  try {
    await store.deleteMyDokumen(doc.id)
    toast.add({ title: 'Dokumen berhasil dihapus', color: 'success' })
    await load()
  } catch (err) {
    toast.add({
      title: 'Gagal menghapus dokumen',
      description: store.error ?? undefined,
      color: 'error',
    })
  } finally {
    deletingId.value = null
  }
}

function statusBadgeColor(status: string) {
  if (status === 'verified') return 'success'
  if (status === 'rejected') return 'error'
  return 'warning'
}
function statusLabel(status: string) {
  if (status === 'verified') return 'Terverifikasi'
  if (status === 'rejected') return 'Ditolak'
  return 'Menunggu Verifikasi'
}
</script>

<template>
  <section>
    <h3 class="mb-1 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Dokumen Persyaratan</h3>
    <p class="mb-3 text-xs text-gray-500 dark:text-gray-400">Unggah berkas dalam format JPG, PNG, atau PDF.</p>

    <div v-if="isLoading" class="flex justify-center py-6">
      <UIcon name="i-lucide-loader-2" class="h-5 w-5 animate-spin text-gray-400 dark:text-gray-500" />
    </div>

    <div v-else class="space-y-3">
      <div
        v-for="k in kinds"
        :key="k.key"
        class="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700/50 dark:bg-gray-900"
      >
        <div class="min-w-0 flex-1">
          <p class="font-medium text-gray-900 dark:text-gray-100">{{ k.label }}</p>
          <template v-if="docFor(k.key)">
            <div class="mt-1 flex flex-wrap items-center gap-2">
              <span class="truncate text-xs text-gray-600 dark:text-gray-400">{{ docFor(k.key)?.original_filename || '-' }}</span>
              <UBadge :color="statusBadgeColor(docFor(k.key)!.status)" variant="subtle" size="sm">
                {{ statusLabel(docFor(k.key)!.status) }}
              </UBadge>
            </div>
            <p v-if="docFor(k.key)?.status === 'rejected' && docFor(k.key)?.notes" class="mt-1 text-xs text-error">
              Alasan: {{ docFor(k.key)?.notes }}
            </p>
          </template>
          <p v-else class="mt-1 text-xs text-gray-400 dark:text-gray-500">Belum diunggah</p>
        </div>

        <div class="flex shrink-0 items-center gap-2">
          <input
            :ref="(el) => (fileInputs[k.key] = el as HTMLInputElement)"
            type="file"
            accept=".jpg,.jpeg,.png,.pdf"
            class="hidden"
            @change="(e) => handleFileSelect(e, k.key)"
          />

          <template v-if="docFor(k.key)">
            <UButton
              variant="ghost"
              size="xs"
              icon="i-lucide-eye"
              @click="viewDokumen(docFor(k.key)!)"
            >
              Lihat
            </UButton>
            <UButton
              variant="ghost"
              size="xs"
              color="error"
              icon="i-lucide-trash-2"
              :loading="deletingId === docFor(k.key)!.id"
              @click="deleteDokumen(docFor(k.key)!)"
            >
              Hapus
            </UButton>
            <UButton
              v-if="docFor(k.key)?.status === 'rejected'"
              variant="soft"
              size="xs"
              icon="i-lucide-upload"
              :loading="uploadingKind === k.key"
              @click="openFilePicker(k.key)"
            >
              Unggah Ulang
            </UButton>
          </template>
          <UButton
            v-else
            variant="soft"
            size="xs"
            icon="i-lucide-upload"
            :loading="uploadingKind === k.key"
            @click="openFilePicker(k.key)"
          >
            Upload
          </UButton>
        </div>
      </div>
    </div>
  </section>
</template>
