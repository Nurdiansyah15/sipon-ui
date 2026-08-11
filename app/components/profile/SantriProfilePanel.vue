<script setup lang="ts">
import { useKesantrianStore } from '~/stores/kesantrian'
import { getErrorStatus } from '~/utils/errorParser'

const store = useKesantrianStore()
const toast = useToast()

type ViewState = 'loading' | 'not-santri' | 'requested' | 'santri' | 'error'
const viewState = ref<ViewState>('loading')
const isRequesting = ref(false)

async function load() {
  viewState.value = 'loading'
  try {
    await store.fetchMyProfile()
    // fetchMyProfile menelan 404 (set myProfile = null tanpa throw), jadi
    // tentukan state dari myProfile, bukan dari error yang dilempar.
    viewState.value = store.myProfile ? 'santri' : 'not-santri'
  } catch (err) {
    viewState.value = 'error'
  }
}

onMounted(load)

async function submitRequest() {
  isRequesting.value = true
  try {
    await store.requestToBecomeSantri()
    toast.add({ title: 'Permintaan berhasil diajukan', description: 'Menunggu persetujuan admin.', color: 'success' })
    viewState.value = 'requested'
  } catch (err) {
    // 409 di sini paling sering berarti "sudah pernah mengajukan" — anggap
    // saja sudah masuk status menunggu daripada menampilkan error teknis.
    if (getErrorStatus(err) === 409) {
      viewState.value = 'requested'
      return
    }
    toast.add({
      title: 'Gagal mengajukan permintaan',
      description: store.error ?? undefined,
      color: 'error',
    })
  } finally {
    isRequesting.value = false
  }
}
</script>

<template>
  <div>
    <div v-if="viewState === 'loading'" class="flex justify-center py-12">
      <UIcon name="i-lucide-loader-2" class="h-6 w-6 animate-spin text-gray-400 dark:text-gray-500" />
    </div>

    <div v-else-if="viewState === 'error'" class="py-6">
      <UAlert
        icon="i-lucide-triangle-alert"
        color="error"
        variant="subtle"
        title="Gagal memuat data santri"
        :description="store.error ?? 'Terjadi kesalahan, silakan coba lagi.'"
      />
      <UButton class="mt-4" variant="soft" icon="i-lucide-refresh-cw" @click="load">Coba Lagi</UButton>
    </div>

    <div v-else-if="viewState === 'not-santri'" class="py-6 text-center">
      <UIcon name="i-lucide-graduation-cap" class="mx-auto h-10 w-10 text-gray-400 dark:text-gray-500" />
      <h3 class="mt-3 text-base font-semibold text-gray-900 dark:text-gray-100">Belum Terdaftar Sebagai Santri</h3>
      <p class="mx-auto mt-1 max-w-md text-sm text-gray-600 dark:text-gray-400">
        Ajukan permintaan untuk menjadi santri. Admin akan meninjau dan menyetujui permintaan Anda.
      </p>
      <UButton class="mt-4" icon="i-lucide-send" :loading="isRequesting" @click="submitRequest">
        Ajukan Menjadi Santri
      </UButton>
    </div>

    <div v-else-if="viewState === 'requested'" class="py-6">
      <UAlert
        icon="i-lucide-clock"
        color="warning"
        variant="subtle"
        title="Permintaan Sedang Ditinjau"
        description="Permintaan Anda untuk menjadi santri sedang menunggu persetujuan admin. Halaman ini akan menampilkan profil santri setelah disetujui."
      />
    </div>

    <div v-else-if="viewState === 'santri'" class="space-y-8">
      <ProfileSantriProfileForm />
      <ProfileSantriDokumenSection />
    </div>
  </div>
</template>
