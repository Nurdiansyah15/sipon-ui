<script setup lang="ts">
import { usePsbStore } from '~/stores/psb'
import { parseApiError } from '~/utils/errorParser'

definePageMeta({ layout: 'default' })

const psbStore = usePsbStore()
const router = useRouter()
const toast = useToast()

const isSubmitting = ref(false)

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
    await psbStore.submitDaftarUlang()
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
    <div class="mb-8">
      <UButton color="neutral" variant="ghost" icon="i-lucide-arrow-left" size="sm" class="mb-3" @click="router.push('/psb')" />
      <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Daftar Ulang</h1>
      <p class="mt-1 text-sm text-gray-500">
        {{ psbStore.isPerluRevisiDaftarUlang ? 'Admin meminta revisi daftar ulang. Periksa dan lengkapi kembali.' : 'Upload dokumen daftar ulang dan submit.' }}
      </p>
    </div>

    <div v-if="psbStore.isLoading" class="space-y-4">
      <USkeleton class="h-64 w-full" />
    </div>

    <div v-else-if="psbStore.pendaftar" class="lg:grid lg:grid-cols-3 lg:items-start lg:gap-8">
      <div class="space-y-6 lg:col-span-2">
        <!-- Profile read-only -->
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

        <!-- Dokumen daftar ulang -->
        <div class="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700/50 dark:bg-gray-900">
          <div class="mb-5 flex items-center gap-3">
            <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-50 dark:bg-teal-950">
              <UIcon name="i-lucide-file-text" class="h-5 w-5 text-teal-600 dark:text-teal-400" />
            </div>
            <div>
              <h3 class="font-semibold text-gray-900 dark:text-gray-100">Upload Dokumen Daftar Ulang</h3>
              <p class="text-sm text-gray-500">Upload bukti pembayaran administrasi awal dan dokumen pendukung lainnya.</p>
            </div>
          </div>
          <PsbDocumentUploader stage="daftar_ulang" />
        </div>
      </div>

      <!-- Submit sidebar -->
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
