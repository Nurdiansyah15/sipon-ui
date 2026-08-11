<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'
import { usePsbStore } from '~/stores/psb'
import { useKesantrianStore } from '~/stores/kesantrian'
import { parseApiError } from '~/utils/errorParser'

definePageMeta({ layout: 'default' })

const authStore = useAuthStore()
const psbStore = usePsbStore()
const kesantrianStore = useKesantrianStore()
const toast = useToast()

const isSubmitting = ref(false)
const showVerifyEmail = ref(false)

const pageLoading = computed(() => psbStore.isLoading)
const pageError = computed(() => psbStore.error)

const userEmailVerified = computed(() => authStore.user?.is_email_verified ?? false)

// Sudah jadi santri → tidak boleh daftar (isi formulir) lagi.
const isAlreadySantri = computed(() => kesantrianStore.myProfile?.status === 'SANTRI')

watch(showVerifyEmail, async (open, prev) => {
  if (prev && !open) {
    await authStore.fetchMe()
  }
})

onMounted(async () => {
  await Promise.all([kesantrianStore.fetchMyProfile(), psbStore.fetchActiveSetting()])
  if (psbStore.noActiveSetting) return

  if (!isAlreadySantri.value) {
    await psbStore.fetchPendaftaran()
    if (psbStore.pendaftar) {
      await psbStore.fetchRiwayat()
    }
  }
})

async function handleSubmit() {
  isSubmitting.value = true
  try {
    await psbStore.submitPendaftaran()
    await psbStore.fetchPendaftaran()
    await psbStore.fetchRiwayat()
    toast.add({ title: 'Pendaftaran berhasil diajukan!', color: 'success' })
  } catch (err) {
    toast.add({ title: 'Gagal mengajukan', description: parseApiError(err, 'Terjadi kesalahan'), color: 'error' })
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="mx-auto max-w-7xl px-4 py-8">
    <h1 class="mb-6 text-2xl font-bold text-gray-900 dark:text-gray-100">Pendaftaran Santri Baru</h1>

    <!-- Loading -->
    <div v-if="pageLoading" class="space-y-4">
      <USkeleton class="h-32 w-full" />
      <USkeleton class="h-16 w-full" />
    </div>

    <!-- Error -->
    <div v-else-if="pageError" class="rounded-lg border border-red-200 bg-red-50 p-6 text-center dark:border-red-800 dark:bg-red-950">
      <UIcon name="i-lucide-alert-circle" class="mx-auto mb-2 h-8 w-8 text-red-500" />
      <p class="text-red-700 dark:text-red-300">{{ pageError }}</p>
      <UButton class="mt-4" variant="soft" @click="psbStore.fetchActiveSetting">Coba Lagi</UButton>
    </div>

    <!-- No Active Period -->
    <div v-else-if="psbStore.noActiveSetting" class="rounded-lg border border-gray-200 bg-white p-8 text-center dark:border-gray-700/50 dark:bg-gray-900">
      <UIcon name="i-lucide-calendar-off" class="mx-auto mb-3 h-12 w-12 text-gray-300" />
      <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Pendaftaran Belum Dibuka</h2>
      <p class="mt-2 text-gray-500 dark:text-gray-400">Saat ini belum ada periode pendaftaran yang aktif. Silakan periksa kembali nanti.</p>
    </div>

    <!-- Sudah jadi santri -->
    <div v-else-if="isAlreadySantri" class="space-y-6">
      <div class="rounded-lg border border-blue-200 bg-blue-50 p-8 text-center dark:border-blue-800 dark:bg-blue-950">
        <UIcon name="i-lucide-check-circle" class="mx-auto mb-3 h-12 w-12 text-blue-500" />
        <h2 class="text-lg font-semibold text-blue-900 dark:text-blue-100">Anda Sudah Terdaftar sebagai Santri</h2>
        <p class="mx-auto mt-2 max-w-lg text-sm text-blue-700 dark:text-blue-300">
          Akun Anda sudah berstatus santri. Pendaftaran santri baru (PSB) tidak tersedia untuk santri aktif.
        </p>
        <div class="mt-4 flex justify-center gap-2">
          <UButton icon="i-lucide-user" to="/profile">Lihat Profil Santri</UButton>
        </div>
      </div>
    </div>

    <!-- Not registered yet -->
    <div v-else-if="psbStore.notFound" class="space-y-6">
      <PsbPeriodInfoCard v-if="psbStore.setting" :setting="psbStore.setting" />

      <div v-if="!userEmailVerified" class="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950">
        <div class="flex items-center gap-3">
          <UIcon name="i-lucide-mail-warning" class="h-6 w-6 text-amber-500" />
          <div>
            <p class="font-medium text-amber-800 dark:text-amber-200">Verifikasi Email Diperlukan</p>
            <p class="text-sm text-amber-600 dark:text-amber-400">Anda harus memverifikasi email sebelum mengisi formulir pendaftaran.</p>
          </div>
          <UButton class="ml-auto" size="sm" color="warning" @click="showVerifyEmail = true">Verifikasi Sekarang</UButton>
        </div>
      </div>

      <div v-else class="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700/50 dark:bg-gray-900">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Mulai Pendaftaran</h2>
        <p class="mt-2 text-gray-500 dark:text-gray-400">Anda belum mendaftar di periode ini. Klik tombol di bawah untuk memulai.</p>
        <UButton class="mt-4" size="lg" icon="i-lucide-pencil" to="/psb/formulir">Isi Formulir Pendaftaran</UButton>
      </div>
    </div>

    <!-- Registered - status-driven -->
    <div v-else-if="psbStore.pendaftar" class="space-y-6">
      <!-- Email verification gate -->
      <div v-if="!userEmailVerified" class="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950">
        <div class="flex items-center gap-3">
          <UIcon name="i-lucide-mail-warning" class="h-6 w-6 text-amber-500" />
          <div>
            <p class="font-medium text-amber-800 dark:text-amber-200">Email Belum Diverifikasi</p>
            <p class="text-sm text-amber-600 dark:text-amber-400">Verifikasi email Anda untuk melanjutkan pendaftaran.</p>
          </div>
          <UButton class="ml-auto" size="sm" color="warning" @click="showVerifyEmail = true">Verifikasi Sekarang</UButton>
        </div>
      </div>

      <!-- Period info -->
      <PsbPeriodInfoCard v-if="psbStore.setting" :setting="psbStore.setting" />

      <!-- Status header -->
      <div class="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700/50 dark:bg-gray-900">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Status Pendaftaran</h2>
            <p class="text-sm text-gray-500">
              <span v-if="psbStore.pendaftar.no_regis">No. Registrasi: <code class="text-gray-900 dark:text-gray-100">{{ psbStore.pendaftar.no_regis }}</code></span>
              <span v-if="psbStore.pendaftar.no_regis && psbStore.pendaftar.nis" class="mx-2">|</span>
              <span> NIS: {{ psbStore.pendaftar.nis || '—' }}</span>
            </p>
          </div>
          <PsbStatusBadge :status="psbStore.pendaftar.status" size="md" />
        </div>

        <!-- CTA per status -->
        <div class="mt-6 space-y-3">
          <!-- Draft / Perlu Revisi -->
          <template v-if="psbStore.canEditForm">
            <p class="text-sm text-gray-500">
              {{ psbStore.isPerluRevisi ? 'Admin meminta revisi pada formulir Anda. Silakan periksa catatan revisi dan lengkapi formulir.' : 'Lengkapi formulir pendaftaran Anda.' }}
            </p>
            <div class="flex gap-2">
              <UButton
                v-if="userEmailVerified"
                icon="i-lucide-pencil"
                to="/psb/formulir"
              >Edit Formulir</UButton>
              <UButton
                v-else
                color="warning"
                icon="i-lucide-mail-warning"
                @click="showVerifyEmail = true"
              >Verifikasi Email untuk Melanjutkan</UButton>
              <UButton
                v-if="userEmailVerified"
                :loading="isSubmitting"
                color="primary"
                icon="i-lucide-send"
                @click="handleSubmit"
              >
                {{ psbStore.isPerluRevisi ? 'Ajukan Ulang' : 'Ajukan Pendaftaran' }}
              </UButton>
              <UButton color="neutral" variant="ghost" to="/psb/riwayat">Lihat Riwayat</UButton>
            </div>
          </template>

          <!-- Diajukan -->
          <template v-if="psbStore.isDiajukan">
            <div class="rounded-lg bg-blue-50 p-3 dark:bg-blue-950">
              <p class="text-sm text-blue-700 dark:text-blue-300">Pendaftaran Anda sedang diverifikasi oleh admin. Mohon tunggu.</p>
            </div>
            <UButton color="neutral" variant="ghost" to="/psb/riwayat">Lihat Riwayat</UButton>
          </template>

          <!-- Ditolak (terminal) -->
          <template v-if="psbStore.isDitolak">
            <div class="rounded-lg bg-red-50 p-3 dark:bg-red-950">
              <p class="text-sm text-red-700 dark:text-red-300">Pendaftaran Anda ditolak. Silakan coba lagi di periode berikutnya.</p>
            </div>
            <UButton color="neutral" variant="ghost" to="/psb/riwayat">Lihat Riwayat</UButton>
          </template>

          <!-- Diterima -->
          <template v-if="psbStore.isDiterima">
            <div class="rounded-lg bg-green-50 p-3 dark:bg-green-950">
              <p class="text-sm text-green-700 dark:text-green-300">Selamat! Pendaftaran Anda diterima. Silakan lakukan daftar ulang.</p>
            </div>
            <UButton icon="i-lucide-check-circle" to="/psb/daftar-ulang">Daftar Ulang</UButton>
          </template>

          <!-- Mengundurkan Diri (terminal) -->
          <template v-if="psbStore.isMengundurkanDiri">
            <div class="rounded-lg bg-orange-50 p-3 dark:bg-orange-950">
              <p class="text-sm text-orange-700 dark:text-orange-300">Anda dinyatakan mengundurkan diri karena tidak melakukan daftar ulang tepat waktu.</p>
            </div>
          </template>

          <!-- Daftar Ulang -->
          <template v-if="psbStore.isDaftarUlang">
            <div class="rounded-lg bg-indigo-50 p-3 dark:bg-indigo-950">
              <p class="text-sm text-indigo-700 dark:text-indigo-300">Daftar ulang Anda sedang diverifikasi. Mohon tunggu.</p>
            </div>
            <UButton color="neutral" variant="ghost" to="/psb/riwayat">Lihat Riwayat</UButton>
          </template>

          <!-- Perlu Revisi Daftar Ulang -->
          <template v-if="psbStore.isPerluRevisiDaftarUlang">
            <p class="text-sm text-gray-500">Admin meminta revisi pada daftar ulang Anda.</p>
            <UButton icon="i-lucide-upload" to="/psb/daftar-ulang">Daftar Ulang Lagi</UButton>
          </template>

          <!-- Selesai (terminal sukses) -->
          <template v-if="psbStore.isSelesai">
            <div class="rounded-lg bg-green-50 p-4 text-center dark:bg-green-950">
              <UIcon name="i-lucide-check-circle" class="mx-auto h-10 w-10 text-green-500" />
              <h3 class="mt-2 font-semibold text-green-700 dark:text-green-300">Pendaftaran Selesai</h3>
              <p class="mt-1 text-sm text-green-600 dark:text-green-400">
                Selamat! Anda resmi menjadi santri.
                <span v-if="psbStore.pendaftar.no_regis" class="block">No. Registrasi: <span class="font-mono font-bold">{{ psbStore.pendaftar.no_regis }}</span></span>
                <span>NIS: <span class="font-mono font-bold">{{ psbStore.pendaftar.nis }}</span></span>
              </p>
            </div>
          </template>
        </div>
      </div>

      <!-- Riwayat (always show if exists) -->
      <div v-if="psbStore.reviews.length > 0" class="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700/50 dark:bg-gray-900">
        <h3 class="mb-4 font-semibold text-gray-900 dark:text-gray-100">Riwayat Review</h3>
        <PsbReviewTimeline :items="psbStore.reviews" />
      </div>
    </div>

    <!-- Verify Email Modal -->
    <ProfileVerifyEmailModal :open="showVerifyEmail" @update:open="showVerifyEmail = $event" />
  </div>
</template>
