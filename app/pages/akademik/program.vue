<script setup lang="ts">
import { useAkademikSantriStore } from '~/stores/akademik-santri'
import { parseApiError, getErrorStatus } from '~/utils/errorParser'
import type { ProgramTransferRequest } from '#shared/types/Akademik'

definePageMeta({ layout: 'default' })

const store = useAkademikSantriStore()
const router = useRouter()
const toast = useToast()

const notSantri = ref(false)

const requestOpen = ref(false)
const hasPending = computed(() => store.myProgramTransferRequests.some((r) => r.status === 'pending'))

async function loadAll() {
  try {
    await store.fetchSummary()
  } catch (err) {
    if (getErrorStatus(err) === 404) {
      notSantri.value = true
    } else {
      toast.add({ title: 'Gagal memuat data', description: parseApiError(err), color: 'error' })
    }
  }
  try {
    await store.fetchMyProgramTransferRequests()
  } catch (err) {
    toast.add({ title: 'Gagal memuat riwayat', description: parseApiError(err), color: 'error' })
  }
}

onMounted(loadAll)

function statusBadgeColor(status: string) {
  if (status === 'approved') return 'success'
  if (status === 'rejected') return 'error'
  return 'warning'
}

function statusLabel(status: string) {
  if (status === 'approved') return 'Disetujui'
  if (status === 'rejected') return 'Ditolak'
  return 'Menunggu'
}

function formatDate(value?: string | null) {
  if (!value) return '-'
  try {
    return new Date(value).toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return value
  }
}

function programLabel(p?: { code: string; name: string } | null) {
  return p ? `${p.code} — ${p.name}` : '-'
}
</script>

<template>
  <div class="mx-auto max-w-4xl px-4 py-8">
    <div class="mb-8 flex items-start justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Program Saya</h1>
        <p class="mt-1 text-sm text-gray-500">Lihat program aktif dan ajukan pindah program.</p>
      </div>
      <UButton color="neutral" variant="ghost" icon="i-lucide-arrow-left" size="sm" class="shrink-0" @click="router.push('/akademik')">
        Kembali
      </UButton>
    </div>

    <!-- Not a santri -->
    <div v-if="notSantri" class="rounded-lg border border-gray-200 bg-white p-10 text-center dark:border-gray-700/50 dark:bg-gray-900">
      <UIcon name="i-lucide-graduation-cap" class="mx-auto mb-3 h-12 w-12 text-gray-300 dark:text-gray-600" />
      <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Bukan Profil Santri</h2>
      <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">Akun Anda belum terdaftar sebagai santri di sistem ini.</p>
    </div>

    <template v-else>
      <!-- Program aktif -->
      <div class="mb-6 rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700/50 dark:bg-gray-900">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div class="flex items-center gap-3">
            <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-50 dark:bg-teal-950">
              <UIcon name="i-lucide-graduation-cap" class="h-6 w-6 text-teal-600 dark:text-teal-400" />
            </div>
            <div>
              <p class="text-sm text-gray-500">Program Aktif</p>
              <template v-if="store.program">
                <p class="text-lg font-bold text-gray-900 dark:text-gray-100">{{ store.program.name }}</p>
                <p class="text-xs text-gray-500">{{ store.program.code }}</p>
              </template>
              <p v-else class="text-sm text-gray-500">Belum terdaftar di program manapun.</p>
            </div>
          </div>
          <UButton
            v-if="store.program && !hasPending"
            color="primary"
            icon="i-lucide-arrow-right-left"
            size="sm"
            @click="requestOpen = true"
          >
            Ajukan Pindah Program
          </UButton>
          <UBadge v-else-if="hasPending" color="warning" variant="subtle" size="sm">
            Menunggu review admin
          </UBadge>
        </div>
      </div>

      <!-- Riwayat request -->
      <div class="rounded-lg border border-gray-200 bg-white dark:border-gray-700/50 dark:bg-gray-900">
        <div class="border-b border-gray-200 px-6 py-4 dark:border-gray-700/50">
          <h2 class="font-semibold text-gray-900 dark:text-gray-100">Riwayat Permintaan Pindah</h2>
        </div>
        <div class="p-6">
          <div v-if="store.isLoading && store.myProgramTransferRequests.length === 0" class="space-y-3">
            <USkeleton v-for="i in 3" :key="i" class="h-12 w-full" />
          </div>
          <div v-else-if="store.myProgramTransferRequests.length === 0" class="py-6 text-center">
            <UIcon name="i-lucide-inbox" class="mx-auto mb-2 h-8 w-8 text-gray-300 dark:text-gray-600" />
            <p class="text-sm text-gray-500">Belum ada permintaan pindah program.</p>
          </div>
          <ul v-else class="divide-y divide-gray-100 dark:divide-gray-700/50">
            <li v-for="req in store.myProgramTransferRequests" :key="req.id" class="flex flex-wrap items-center justify-between gap-3 py-3">
              <div class="min-w-0">
                <div class="flex flex-wrap items-center gap-2">
                  <span class="text-sm font-medium text-gray-900 dark:text-gray-100">{{ programLabel(req.from_program) }}</span>
                  <UIcon name="i-lucide-arrow-right" class="h-4 w-4 text-gray-400" />
                  <span class="text-sm font-medium text-gray-900 dark:text-gray-100">{{ programLabel(req.to_program) }}</span>
                </div>
                <p v-if="req.notes" class="mt-1 text-xs text-gray-500 dark:text-gray-400">Catatan: {{ req.notes }}</p>
                <p class="mt-0.5 text-xs text-gray-400">{{ formatDate(req.created_at) }}</p>
              </div>
              <UBadge :color="statusBadgeColor(req.status)" variant="subtle" size="sm">
                {{ statusLabel(req.status) }}
              </UBadge>
            </li>
          </ul>
        </div>
      </div>
    </template>

    <AkademikRequestProgramTransferModal
      v-model:open="requestOpen"
      :current-program-id="store.program?.id ?? ''"
      @success="loadAll"
    />
  </div>
</template>
