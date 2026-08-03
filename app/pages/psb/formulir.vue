<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'
import { usePsbStore } from '~/stores/psb'
import { parseApiError } from '~/utils/errorParser'

definePageMeta({ layout: 'default' })

const authStore = useAuthStore()
const psbStore = usePsbStore()
const router = useRouter()
const toast = useToast()

const isSubmitting = ref(false)
const showVerifyEmail = ref(false)

const userEmailVerified = computed(() => authStore.user?.is_email_verified ?? false)

watch(showVerifyEmail, async (open, prev) => {
  if (prev && !open) {
    await authStore.fetchMe()
  }
})

onMounted(async () => {
  await psbStore.fetchActiveSetting()
  if (psbStore.noActiveSetting) {
    router.replace('/psb')
    return
  }

  if (!userEmailVerified.value) return

  await psbStore.fetchPendaftaran()

  if (psbStore.pendaftar && !psbStore.canEditForm) {
    router.replace('/psb')
    return
  }
})

async function handleSaved() {
  await psbStore.fetchPendaftaran()
  toast.add({ title: 'Formulir tersimpan', color: 'success' })
}

async function handleSubmit() {
  isSubmitting.value = true
  try {
    await psbStore.submitPendaftaran()
    await psbStore.fetchPendaftaran()
    toast.add({ title: 'Pendaftaran berhasil diajukan!', color: 'success' })
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
    <div class="mb-6 flex items-center justify-between">
      <div>
        <UButton color="neutral" variant="ghost" icon="i-lucide-arrow-left" size="sm" @click="router.push('/psb')" />
        <h1 class="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100">Formulir Pendaftaran</h1>
        <p class="text-sm text-gray-500">
          {{ psbStore.isPerluRevisi ? 'Admin meminta revisi. Silakan periksa dan lengkapi data Anda.' : 'Isi data diri calon santri dengan lengkap.' }}
        </p>
      </div>
    </div>

    <!-- Email verification gate -->
    <div v-if="!userEmailVerified" class="rounded-lg border border-amber-200 bg-amber-50 p-8 text-center dark:border-amber-800 dark:bg-amber-950">
      <UIcon name="i-lucide-mail-warning" class="mx-auto mb-3 h-10 w-10 text-amber-500" />
      <h2 class="text-lg font-semibold text-amber-800 dark:text-amber-200">Verifikasi Email Diperlukan</h2>
      <p class="mt-2 text-amber-600 dark:text-amber-400">
        Anda harus memverifikasi email sebelum mengisi formulir pendaftaran.
      </p>
      <div class="mt-4 flex justify-center gap-2">
        <UButton color="neutral" variant="ghost" @click="router.push('/psb')">Kembali</UButton>
        <UButton color="warning" @click="showVerifyEmail = true">Verifikasi Email</UButton>
      </div>
    </div>

    <div v-else-if="psbStore.isLoading" class="space-y-4">
      <USkeleton class="h-64 w-full" />
    </div>

    <div v-else class="space-y-6">
      <PsbFormWizard @saved="handleSaved" />

      <div v-if="psbStore.pendaftar" class="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
        <div class="flex items-center justify-between">
          <p class="text-sm text-gray-500">Setelah formulir lengkap, klik tombol di bawah untuk mengajukan pendaftaran.</p>
          <UButton
            :loading="isSubmitting"
            size="lg"
            icon="i-lucide-send"
            @click="handleSubmit"
          >
            {{ psbStore.isPerluRevisi ? 'Ajukan Ulang' : 'Ajukan Pendaftaran' }}
          </UButton>
        </div>
      </div>
    </div>

    <ProfileVerifyEmailModal :open="showVerifyEmail" @update:open="showVerifyEmail = $event" />
  </div>
</template>
