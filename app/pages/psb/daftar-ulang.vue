<script setup lang="ts">
import { usePsbStore } from '~/stores/psb'
import { parseApiError } from '~/utils/errorParser'

definePageMeta({ layout: 'default' })

const psbStore = usePsbStore()
const router = useRouter()
const toast = useToast()

const isSubmitting = ref(false)

const dokumenPendaftaran = computed(() =>
  psbStore.dokumen.filter(d => d.stage === 'pendaftaran')
)

const kindLabel: Record<string, string> = {
  surat_pernyataan: 'Surat Pernyataan',
  ktp: 'KTP',
  kk: 'Kartu Keluarga',
  mutasi: 'Surat Mutasi',
  pembayaran: 'Bukti Pembayaran',
}

function statusColor(status: string): string {
  return status === 'verified' ? 'success' : status === 'rejected' ? 'error' : 'neutral'
}

function statusLabel(status: string): string {
  return status === 'verified' ? 'Diverifikasi' : status === 'rejected' ? 'Ditolak' : 'Menunggu'
}

onMounted(async () => {
  await psbStore.fetchActiveSetting()
  if (psbStore.noActiveSetting) {
    router.replace('/psb')
    return
  }

  await psbStore.fetchPendaftaran()
  if (!psbStore.pendaftar || !psbStore.canSubmitDaftarUlang) {
    router.replace('/psb')
    return
  }

  await psbStore.fetchDokumen()
})

async function handleSubmit() {
  isSubmitting.value = true
  try {
    const body: any = {}
    const pending = psbStore.pendingDokumenList.filter(d => d.stage === 'daftar_ulang')
    if (pending.length > 0) {
      body.dokumen = pending
    }
    await psbStore.submitDaftarUlang(body)
    psbStore.clearPendingDokumen()
    await psbStore.fetchPendaftaran()
    toast.add({ title: 'Daftar ulang berhasil diajukan!', color: 'success' })
    router.replace('/psb')
  } catch (err) {
    toast.add({ title: 'Gagal mengajukan', description: parseApiError(err, 'Terjadi kesalahan'), color: 'error' })
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="mx-auto max-w-7xl px-4 py-8">
    <div class="mb-8 flex items-start justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Daftar Ulang</h1>
        <p class="mt-1 text-sm text-gray-500">
          {{ psbStore.isPerluRevisiDaftarUlang ? 'Admin meminta revisi daftar ulang. Periksa dan lengkapi kembali.' : 'Upload dokumen daftar ulang dan submit.' }}
        </p>
      </div>
      <UButton color="neutral" variant="ghost" icon="i-lucide-arrow-left" size="sm" class="shrink-0" @click="router.push('/psb')">Kembali</UButton>
    </div>

    <div v-if="psbStore.isLoading" class="space-y-4">
      <USkeleton class="h-64 w-full" />
    </div>

    <div v-else-if="psbStore.pendaftar" class="lg:grid lg:grid-cols-3 lg:items-start lg:gap-8">
      <div class="space-y-6 lg:col-span-2">
        <div class="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700/50 dark:bg-gray-900">
          <div class="mb-5 flex items-center gap-3">
            <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-50 dark:bg-teal-950">
              <UIcon name="i-lucide-user" class="h-5 w-5 text-teal-600 dark:text-teal-400" />
            </div>
            <div>
              <h3 class="font-semibold text-gray-900 dark:text-gray-100">Data Calon Santri</h3>
              <p class="text-sm text-gray-500">Data terverifikasi dari formulir pendaftaran.</p>
            </div>
          </div>
          <PsbProfileSummary :profile="psbStore.pendaftar" />
        </div>

        <!-- Dokumen pendaftaran (referensi read-only) -->
        <div
          v-if="dokumenPendaftaran.length > 0"
          class="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700/50 dark:bg-gray-900"
        >
          <div class="mb-5 flex items-center gap-3">
            <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-50 dark:bg-teal-950">
              <UIcon name="i-lucide-folder-check" class="h-5 w-5 text-teal-600 dark:text-teal-400" />
            </div>
            <div>
              <h3 class="font-semibold text-gray-900 dark:text-gray-100">Dokumen Pendaftaran</h3>
              <p class="text-sm text-gray-500">Dokumen yang telah diupload saat pendaftaran.</p>
            </div>
          </div>
          <div class="grid gap-3 sm:grid-cols-2">
            <div
              v-for="doc in dokumenPendaftaran"
              :key="doc.id"
              class="flex items-center justify-between rounded-lg border border-gray-200 p-3 dark:border-gray-700/50"
            >
              <div class="flex min-w-0 items-center gap-3">
                <UIcon name="i-lucide-file-text" class="h-5 w-5 shrink-0 text-gray-400" />
                <div class="min-w-0">
                  <p class="truncate text-sm font-medium text-gray-900 dark:text-gray-100">{{ kindLabel[doc.kind] ?? doc.kind }}</p>
                  <p class="truncate text-xs text-gray-400">{{ doc.original_filename }}</p>
                </div>
              </div>
              <UBadge :color="statusColor(doc.status)" variant="subtle" size="xs">
                {{ statusLabel(doc.status) }}
              </UBadge>
            </div>
          </div>
        </div>

        <div class="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700/50 dark:bg-gray-900">
          <div class="mb-5 flex items-center gap-3">
            <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-50 dark:bg-teal-950">
              <UIcon name="i-lucide-file-text" class="h-5 w-5 text-teal-600 dark:text-teal-400" />
            </div>
            <div>
              <h3 class="font-semibold text-gray-900 dark:text-gray-100">Upload Dokumen Daftar Ulang</h3>
              <p class="text-sm text-gray-500">Upload bukti pembayaran administrasi awal dan dokumen pendukung lainnya. Dokumen akan disimpan bersamaan dengan pengajuan.</p>
            </div>
          </div>
          <PsbDocumentUploader stage="daftar_ulang" />
        </div>
      </div>

      <div class="mt-6 lg:sticky lg:top-24 lg:mt-0">
        <div class="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700/50 dark:bg-gray-900">
          <h3 class="font-semibold text-gray-900 dark:text-gray-100">Ajukan Daftar Ulang</h3>
          <p class="mt-2 text-sm text-gray-500">Pastikan semua dokumen sudah diupload, lalu klik tombol di bawah untuk mengirim daftar ulang.</p>
          <UButton :loading="isSubmitting" block size="lg" icon="i-lucide-send" class="mt-4" @click="handleSubmit">
            Ajukan Daftar Ulang
          </UButton>
        </div>
      </div>
    </div>
  </div>
</template>
