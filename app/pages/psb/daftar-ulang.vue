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
  <div class="mx-auto max-w-3xl px-4 py-8">
    <div class="mb-6">
      <UButton color="neutral" variant="ghost" icon="i-lucide-arrow-left" @click="router.push('/psb')">Kembali</UButton>
      <h1 class="mt-2 text-2xl font-bold text-gray-900 dark:text-gray-100">Daftar Ulang</h1>
      <p class="text-sm text-gray-500">
        {{ psbStore.isPerluRevisiDaftarUlang ? 'Admin meminta revisi daftar ulang. Periksa dan lengkapi kembali.' : 'Upload dokumen daftar ulang dan submit.' }}
      </p>
    </div>

    <div v-if="psbStore.isLoading" class="space-y-4">
      <USkeleton class="h-64 w-full" />
    </div>

    <div v-else-if="psbStore.pendaftar" class="space-y-6">
      <!-- Profile read-only -->
      <PsbProfileSummary :profile="psbStore.pendaftar" />

      <!-- Dokumen daftar ulang -->
      <div class="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
        <h3 class="mb-4 font-semibold text-gray-900 dark:text-gray-100">Upload Dokumen Daftar Ulang</h3>
        <p class="mb-4 text-sm text-gray-500">Upload bukti pembayaran administrasi awal dan dokumen pendukung lainnya.</p>
        <PsbDocumentUploader stage="daftar_ulang" />
      </div>

      <!-- Submit -->
      <div class="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
        <div class="flex items-center justify-between">
          <p class="text-sm text-gray-500">Pastikan semua dokumen sudah diupload, lalu klik tombol di bawah.</p>
          <UButton :loading="isSubmitting" size="lg" icon="i-lucide-send" @click="handleSubmit">
            Ajukan Daftar Ulang
          </UButton>
        </div>
      </div>
    </div>
  </div>
</template>
