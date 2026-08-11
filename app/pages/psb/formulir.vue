<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'
import { usePsbStore } from '~/stores/psb'
import { useKesantrianStore } from '~/stores/kesantrian'

definePageMeta({ layout: 'default' })

const authStore = useAuthStore()
const psbStore = usePsbStore()
const kesantrianStore = useKesantrianStore()
const router = useRouter()
const toast = useToast()

const showVerifyEmail = ref(false)

const userEmailVerified = computed(() => authStore.user?.is_email_verified ?? false)

// Sudah jadi santri → tidak boleh mengisi formulir.
const isAlreadySantri = computed(() => kesantrianStore.myProfile?.status === 'SANTRI')

watch(showVerifyEmail, async (open, prev) => {
  if (prev && !open) {
    await authStore.fetchMe()
  }
})

onMounted(async () => {
  await kesantrianStore.fetchMyProfile()
  if (isAlreadySantri.value) {
    router.replace('/psb')
    return
  }

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
</script>

<template>
  <div class="mx-auto max-w-7xl px-4 py-8">

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

    <div v-else>
      <!-- Header -->
      <div class="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Formulir Pendaftaran</h1>
          <p v-if="psbStore.isPerluRevisi" class="mt-1 text-sm text-amber-600 dark:text-amber-400">
            Admin meminta revisi. Silakan periksa dan lengkapi data Anda.
          </p>
          <p v-else class="mt-1 text-sm text-gray-500">Isi data diri calon santri dengan lengkap.</p>
        </div>
        <UButton color="neutral" variant="ghost" icon="i-lucide-arrow-left" size="sm" class="shrink-0" @click="router.push('/psb')">Kembali</UButton>
      </div>

      <!-- Wizard -->
      <PsbFormWizard @saved="handleSaved" />
    </div>

    <ProfileVerifyEmailModal :open="showVerifyEmail" @update:open="showVerifyEmail = $event" />
  </div>
</template>
