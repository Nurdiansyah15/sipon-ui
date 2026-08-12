<script setup lang="ts">
import { useAkademikSantriStore } from '~/stores/akademik-santri'
import { parseApiError } from '~/utils/errorParser'
import type { HerregistrasiDocument, HerregistrasiDocumentRequirement } from '#shared/types/AkademikSantri'

definePageMeta({ layout: 'default' })

const store = useAkademikSantriStore()
const toast = useToast()

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'application/pdf']

const loading = ref(true)
const uploadingKind = ref<string | null>(null)
const deletingId = ref<string | null>(null)
const fileInputs = ref<Record<string, HTMLInputElement | undefined>>({})

const detail = computed(() => store.myHerreg)
const registration = computed(() => detail.value?.registration ?? null)
const requirements = computed(() => detail.value?.requirements ?? [])

const statusMeta = computed<{ label: string; color: 'success' | 'warning' | 'info' | 'error' | 'neutral' }>(() => {
  switch (registration.value?.status) {
    case 'completed':
      return { label: 'Sudah herregistrasi', color: 'success' }
    case 'revision':
      return { label: 'Perlu revisi', color: 'info' }
    case 'cancelled':
      return { label: 'Dibatalkan', color: 'error' }
    case 'pending':
      return { label: 'Menunggu konfirmasi', color: 'warning' }
    case 'draft':
      return { label: 'Draft', color: 'neutral' }
    default:
      return { label: 'Belum dimulai', color: 'neutral' }
  }
})

// Upload/ubah dokumen hanya saat status draft, pending, atau revision.
const canEdit = computed(() =>
  ['draft', 'pending', 'revision'].includes(registration.value?.status ?? ''),
)

// Hanya draft yang bisa diajukan (submit).
const canSubmit = computed(() => registration.value?.status === 'draft')

const submitting = ref(false)

const missingRequired = computed(() => {
  const uploaded = new Set(detail.value?.documents.map(d => d.kind) ?? [])
  return requirements.value.filter(r => r.is_required && !uploaded.has(r.kind)).map(r => r.label)
})

async function startHerreg() {
  submitting.value = true
  try {
    await store.applyHerregistrasi()
    toast.add({ title: 'Herregistrasi dibuat. Silakan unggah dokumen.', color: 'success' })
    await store.fetchMyHerreg()
  } catch (err) {
    toast.add({ title: 'Gagal memulai herregistrasi', description: parseApiError(err), color: 'error' })
  } finally {
    submitting.value = false
  }
}

async function submitHerreg() {
  submitting.value = true
  try {
    await store.submitHerreg()
    toast.add({ title: 'Herregistrasi diajukan', color: 'success' })
    await store.fetchMyHerreg()
  } catch (err) {
    toast.add({ title: 'Gagal mengajukan', description: parseApiError(err), color: 'error' })
  } finally {
    submitting.value = false
  }
}

function docFor(kind: string): HerregistrasiDocument | undefined {
  return detail.value?.documents.find(d => d.kind === kind)
}

function openFilePicker(kind: string) {
  fileInputs.value[kind]?.click()
}

async function handleFileSelect(event: Event, kind: string) {
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
    const { presign_url, key } = await store.presignDocument({
      kind,
      content_type: file.type,
      filename: file.name,
    })

    const uploadRes = await fetch(presign_url, {
      method: 'PUT',
      body: file,
      headers: { 'Content-Type': file.type },
    })
    if (!uploadRes.ok) {
      throw new Error(`Upload gagal: ${uploadRes.status}`)
    }

    await store.confirmDocument({
      kind,
      key,
      original_filename: file.name,
      mime_type: file.type,
      size: file.size,
    })

    toast.add({ title: 'Dokumen berhasil diunggah', color: 'success' })
    await store.fetchMyHerreg()
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

async function viewDocument(doc: HerregistrasiDocument) {
  try {
    const res = await store.downloadDocument(doc.id)
    window.open(res.download_url, '_blank')
  } catch (err) {
    toast.add({ title: 'Gagal membuka dokumen', description: parseApiError(err), color: 'error' })
  }
}

async function deleteDocument(doc: HerregistrasiDocument) {
  deletingId.value = doc.id
  try {
    await store.deleteDocument(doc.id)
    toast.add({ title: 'Dokumen berhasil dihapus', color: 'success' })
    await store.fetchMyHerreg()
  } catch (err) {
    toast.add({ title: 'Gagal menghapus dokumen', description: parseApiError(err), color: 'error' })
  } finally {
    deletingId.value = null
  }
}

function statusColor(status: string) {
  if (status === 'verified') return 'success'
  if (status === 'rejected') return 'error'
  return 'warning'
}

function statusLabel(status: string) {
  if (status === 'verified') return 'Terverifikasi'
  if (status === 'rejected') return 'Ditolak'
  return 'Menunggu Verifikasi'
}

function requirementNote(req: HerregistrasiDocumentRequirement) {
  return req.is_required ? 'Wajib' : 'Opsional'
}

onMounted(async () => {
  try {
    await store.fetchMyHerreg()
  } catch (err) {
    toast.add({ title: 'Gagal memuat data', description: parseApiError(err), color: 'error' })
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="mx-auto max-w-4xl px-4 py-8">
    <UButton variant="ghost" icon="i-lucide-arrow-left" to="/akademik" class="mb-4">Kembali ke Akademik</UButton>

    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Herregistrasi</h1>
      <p class="mt-1 text-sm text-gray-500">
        Unggah dokumen persyaratan untuk periode
        <span v-if="detail?.academic_period" class="font-medium text-gray-700 dark:text-gray-300">{{ detail.academic_period.name }}</span>.
      </p>
    </div>

    <div v-if="loading" class="space-y-4">
      <USkeleton v-for="i in 4" :key="i" class="h-20 w-full" />
    </div>

    <template v-else>
      <!-- Status -->
      <div class="mb-6 rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-700/50 dark:bg-gray-900">
        <div class="flex items-center justify-between gap-3">
          <div>
            <p class="text-sm text-gray-500">Status Herregistrasi</p>
            <div class="mt-1">
              <UBadge :color="statusMeta.color" variant="subtle">{{ statusMeta.label }}</UBadge>
            </div>
          </div>
          <UIcon name="i-lucide-clipboard-check" class="h-8 w-8 text-gray-300 dark:text-gray-600" />
        </div>
        <div
          v-if="registration?.status === 'revision'"
          class="mt-3 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-200"
        >
          <p class="font-medium">Catatan revisi dari admin:</p>
          <p class="mt-1">{{ registration.revision_notes ?? '—' }}</p>
        </div>
      </div>

      <!-- Belum ada record herreg: mulai dulu -->
      <div
        v-if="!registration"
        class="rounded-lg border border-gray-200 bg-white p-10 text-center dark:border-gray-700/50 dark:bg-gray-900"
      >
        <UIcon name="i-lucide-clipboard-plus" class="mx-auto mb-3 h-12 w-12 text-gray-300 dark:text-gray-600" />
        <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Mulai Herregistrasi</h2>
        <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Buat draft herregistrasi terlebih dahulu, lalu unggah dokumen persyaratan dan ajukan.
        </p>
        <UButton
          class="mt-4"
          icon="i-lucide-file-plus"
          :loading="submitting || store.isSubmitting"
          @click="startHerreg"
        >
          Mulai Herregistrasi
        </UButton>
      </div>

      <template v-else>
        <!-- Dokumen wajib / opsional -->
        <div v-if="requirements.length === 0" class="rounded-lg border border-gray-200 bg-white p-10 text-center dark:border-gray-700/50 dark:bg-gray-900">
          <UIcon name="i-lucide-files" class="mx-auto mb-3 h-12 w-12 text-gray-300 dark:text-gray-600" />
          <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Belum Ada Dokumen yang Dibutuhkan</h2>
          <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">Admin belum menetapkan dokumen untuk periode ini.</p>
        </div>

        <div v-else class="space-y-3">
          <div
            v-for="req in requirements"
            :key="req.id"
            class="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700/50 dark:bg-gray-900"
          >
            <div class="flex flex-wrap items-center justify-between gap-3">
              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-2">
                  <p class="font-medium text-gray-900 dark:text-gray-100">{{ req.label }}</p>
                  <UBadge :color="req.is_required ? 'error' : 'neutral'" variant="subtle" size="xs">
                    {{ requirementNote(req) }}
                  </UBadge>
                </div>
                <p class="mt-0.5 text-xs text-gray-400 dark:text-gray-500">{{ req.kind }}</p>

                <template v-if="docFor(req.kind)">
                  <div class="mt-1 flex flex-wrap items-center gap-2">
                    <span class="truncate text-xs text-gray-600 dark:text-gray-400">{{ docFor(req.kind)?.original_filename || '-' }}</span>
                    <UBadge :color="statusColor(docFor(req.kind)!.status)" variant="subtle" size="sm">
                      {{ statusLabel(docFor(req.kind)!.status) }}
                    </UBadge>
                  </div>
                  <p v-if="docFor(req.kind)?.status === 'rejected' && docFor(req.kind)?.notes" class="mt-1 text-xs text-red-600 dark:text-red-400">
                    Alasan: {{ docFor(req.kind)?.notes }}
                  </p>
                </template>
                <p v-else class="mt-1 text-xs text-gray-400 dark:text-gray-500">Belum diunggah</p>
              </div>

              <div class="flex shrink-0 items-center gap-2">
                <input
                  :ref="(el) => (fileInputs[req.kind] = el as HTMLInputElement)"
                  type="file"
                  accept=".jpg,.jpeg,.png,.pdf"
                  class="hidden"
                  :disabled="!canEdit"
                  @change="(e) => handleFileSelect(e, req.kind)"
                />

                <template v-if="docFor(req.kind)">
                  <UButton variant="ghost" size="xs" icon="i-lucide-eye" @click="viewDocument(docFor(req.kind)!)">
                    Lihat
                  </UButton>
                  <UButton
                    v-if="canEdit"
                    variant="ghost"
                    size="xs"
                    color="error"
                    icon="i-lucide-trash-2"
                    :loading="deletingId === docFor(req.kind)!.id"
                    @click="deleteDocument(docFor(req.kind)!)"
                  >
                    Hapus
                  </UButton>
                  <UButton
                    v-if="canEdit && docFor(req.kind)?.status === 'rejected'"
                    variant="soft"
                    size="xs"
                    icon="i-lucide-upload"
                    :loading="uploadingKind === req.kind"
                    @click="openFilePicker(req.kind)"
                  >
                    Unggah Ulang
                  </UButton>
                </template>
                <UButton
                  v-else-if="canEdit"
                  variant="soft"
                  size="xs"
                  icon="i-lucide-upload"
                  :loading="uploadingKind === req.kind"
                  @click="openFilePicker(req.kind)"
                >
                  Upload
                </UButton>
              </div>
            </div>
          </div>

          <p v-if="!canEdit" class="mt-2 text-xs text-gray-500 dark:text-gray-400">
            Dokumen terkunci karena herregistrasi sudah selesai atau dibatalkan.
          </p>
        </div>

        <!-- Ajukan herreg (hanya saat draft) -->
        <div v-if="canSubmit" class="mt-6 rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-700/50 dark:bg-gray-900">
          <div v-if="missingRequired.length > 0" class="mb-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
            <p class="font-medium">Dokumen wajib berikut belum di-upload:</p>
            <ul class="mt-1 list-inside list-disc">
              <li v-for="label in missingRequired" :key="label">{{ label }}</li>
            </ul>
          </div>
          <UButton
            icon="i-lucide-send"
            class="bg-teal-600 text-white hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-400"
            :loading="submitting || store.isSubmitting"
            :disabled="missingRequired.length > 0"
            @click="submitHerreg"
          >
            Ajukan Herregistrasi
          </UButton>
        </div>
      </template>
    </template>
  </div>
</template>
