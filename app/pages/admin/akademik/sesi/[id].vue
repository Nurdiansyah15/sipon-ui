<script setup lang="ts">
import type { SyncFingerprintResponse } from '#shared/types/Akademik'
import { useAkademikStore } from '~/stores/akademik'
import { usePermission } from '~/composables/usePermission'

definePageMeta({ layout: 'akademik' })

const route = useRoute()
const id = computed(() => (route.params as Record<string, string>).id ?? '')

const store = useAkademikStore()
const toast = useToast()
const { can } = usePermission()

const loading = ref(true)
const notFound = ref(false)
const session = ref<SessionDetail | null>(null)

interface SessionDetail {
  id: string
  activity_schedule_id: string
  activity_name?: string
  activity_code?: string
  schedule_type?: string
  starts_at: string
  ends_at: string
  status: string
  attendance_summary?: {
    total: number
    present: number
    absent: number
    excused: number
  }
}

async function load(silent = false) {
  if (!silent) loading.value = true
  notFound.value = false
  try {
    session.value = await store.fetchSession(id.value)
  } catch {
    if (!silent) notFound.value = true
  } finally {
    if (!silent) loading.value = false
  }
}

async function loadAttendance() {
  try {
    await store.fetchAttendance(id.value)
  } catch {
    // ignore — error in store
  }
}

let pollTimer: ReturnType<typeof setInterval> | null = null

// Countdown (detik) sampai refresh berikutnya, hanya berjalan saat sesi open.
const countdown = ref(0)

function resetCountdown() {
  countdown.value = 30
}

function stopPolling() {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
}

// Polling tiap 30 detik selama sesi berstatus open (berlangsung) —
// sinkronisasi fingerprint berjalan di worker BE, halaman ini ikut merefresh
// detail sesi + daftar absensi agar data terlihat update tanpa reload manual.
function startPolling() {
  stopPolling()
  resetCountdown()
  pollTimer = setInterval(() => {
    if (document.visibilityState === 'visible' && session.value?.status === 'open') {
      load(true)
      loadAttendance()
      resetCountdown()
    }
  }, 30_000)
}

// Ticker countdown 1 detik yang tampil ke pengguna sebagai loader berjalan.
let countdownTimer: ReturnType<typeof setInterval> | null = null
function startCountdown() {
  stopCountdown()
  countdownTimer = setInterval(() => {
    if (session.value?.status === 'open' && countdown.value > 0) {
      countdown.value -= 1
    }
  }, 1_000)
}
function stopCountdown() {
  if (countdownTimer) {
    clearInterval(countdownTimer)
    countdownTimer = null
  }
}

onMounted(async () => {
  await load()
  if (session.value) await loadAttendance()
  startPolling()
  startCountdown()
})

onUnmounted(() => {
  stopPolling()
  stopCountdown()
})

function fmtDateTime(v: string) {
  return new Date(v).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const confirmOpen = ref(false)
const confirmTitle = ref('')
const confirmMessage = ref('')
const confirmAction = ref<'complete' | 'cancel'>('complete')
const confirmRunning = ref(false)

function completeSession() {
  confirmAction.value = 'complete'
  confirmTitle.value = 'Selesaikan Sesi'
  confirmMessage.value = 'Tandai sesi ini sebagai selesai?'
  confirmOpen.value = true
}

function cancelSession() {
  confirmAction.value = 'cancel'
  confirmTitle.value = 'Batalkan Sesi'
  confirmMessage.value = 'Yakin ingin membatalkan sesi ini?'
  confirmOpen.value = true
}

async function confirmRun() {
  confirmRunning.value = true
  try {
    if (confirmAction.value === 'complete') {
      await store.completeSession(id.value)
      toast.add({ title: 'Sesi diselesaikan', color: 'success' })
    } else {
      await store.cancelSession(id.value)
      toast.add({ title: 'Sesi dibatalkan', color: 'success' })
    }
    confirmOpen.value = false
    await load()
  } catch {
    toast.add({ title: store.error ?? 'Gagal mengubah status sesi', color: 'error' })
  } finally {
    confirmRunning.value = false
  }
}

const recorderOpen = ref(false)

function onAttendanceChanged() {
  loadAttendance()
  load()
}

const syncOpen = ref(false)
const syncRunning = ref(false)
const syncResult = ref<SyncFingerprintResponse | null>(null)

async function syncFingerprint() {
  syncRunning.value = true
  try {
    syncResult.value = await store.syncFingerprintAttendance(id.value)
    syncOpen.value = true
    await loadAttendance()
    await load()
  } catch {
    toast.add({ title: store.error ?? 'Gagal sinkronisasi absensi dari fingerprint', color: 'error' })
  } finally {
    syncRunning.value = false
  }
}

const summaryCards = computed(() => {
  const s = session.value?.attendance_summary
  if (!s) return null
  const notRecorded = Math.max(s.total - s.present - s.absent - s.excused, 0)
  return [
    { label: 'Total', value: s.total, color: 'text-gray-700 dark:text-gray-300', bg: 'bg-gray-100 dark:bg-gray-800' },
    { label: 'Hadir', value: s.present, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-950' },
    { label: 'Alpa', value: s.absent, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-950' },
    { label: 'Izin', value: s.excused, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950' },
    { label: 'Belum Dicatat', value: notRecorded, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950' },
  ]
})

const canOpen = computed(() => session.value && session.value.status === 'scheduled')
const canRecord = computed(() => session.value && session.value.status === 'open')
const canComplete = computed(() => session.value && (session.value.status === 'scheduled' || session.value.status === 'open'))
const canCancel = computed(() => session.value && session.value.status !== 'completed' && session.value.status !== 'cancelled')

const opening = ref(false)

async function openSessionRun() {
  opening.value = true
  try {
    await store.openSession(id.value)
    toast.add({ title: 'Sesi dibuka — absensi dapat dicatat', color: 'success' })
    await load()
  } catch {
    toast.add({ title: store.error ?? 'Gagal membuka sesi', color: 'error' })
  } finally {
    opening.value = false
  }
}
</script>

<template>
  <div class="mx-auto max-w-5xl px-4 py-8">
      <div class="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {{ session?.activity_name ?? 'Detail Sesi' }}
          </h1>
          <p v-if="session" class="mt-1 text-sm text-gray-700 dark:text-gray-300">
            {{ session.activity_code }}
          </p>
        </div>
        <div v-if="session" class="flex items-center gap-2">
          <UButton
            to="/admin/akademik/sesi"
            icon="i-lucide-arrow-left"
            color="neutral"
            variant="outline"
          >
            Kembali
          </UButton>
          <AkademikStatusBadge :status="session.status as any" type="session" />
        <UButton
          v-if="can('manage_akademik') && canOpen"
          color="primary"
          variant="outline"
          icon="i-lucide-play"
          :loading="opening"
          @click="openSessionRun"
        >
          Buka Sesi
        </UButton>
        <UButton
          v-if="can('manage_akademik') && canRecord"
          color="primary"
          icon="i-lucide-scan-line"
          :to="`/presensi/${session.id}`"
          target="_blank"
        >
          Buka Presensi
        </UButton>
        <UButton
          v-if="can('manage_akademik') && canRecord"
          color="primary"
          variant="outline"
          icon="i-lucide-fingerprint-pattern"
          :loading="syncRunning"
          @click="syncFingerprint"
        >
          Sync Fingerprint
        </UButton>
        <UButton
          v-if="can('manage_akademik') && canComplete"
          color="success"
          variant="outline"
          icon="i-lucide-check"
          @click="completeSession"
        >
          Selesaikan
        </UButton>
        <UButton
          v-if="can('manage_akademik') && canCancel"
          color="error"
          variant="outline"
          icon="i-lucide-x"
          @click="cancelSession"
        >
          Batalkan
        </UButton>
      </div>
    </div>

    <div v-if="loading" class="flex justify-center py-16">
      <UIcon name="i-lucide-loader-circle" class="h-8 w-8 animate-spin text-teal-600" />
    </div>

    <div v-else-if="notFound || !session" class="rounded-lg border border-dashed border-gray-300 p-8 text-center text-gray-500 dark:border-gray-600 dark:text-gray-400">
      Sesi tidak ditemukan.
    </div>

    <template v-else>
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div
          v-for="card in summaryCards ?? []"
          :key="card.label"
          class="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700/50 dark:bg-gray-900"
        >
          <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg" :class="card.bg">
            <span class="text-lg font-bold" :class="card.color">{{ card.value }}</span>
          </div>
          <div>
            <p class="text-xs text-gray-500 dark:text-gray-400">{{ card.label }}</p>
          </div>
        </div>
      </div>

      <div class="mt-4 grid gap-4 sm:grid-cols-2">
        <div class="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700/50 dark:bg-gray-900">
          <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-50 dark:bg-teal-950">
            <UIcon name="i-lucide-clock" class="h-5 w-5 text-teal-600 dark:text-teal-400" />
          </div>
          <div>
            <p class="text-xs text-gray-500 dark:text-gray-400">Mulai Sesi</p>
            <p class="text-sm font-semibold text-gray-900 dark:text-gray-100">{{ fmtDateTime(session.starts_at) }}</p>
          </div>
        </div>
        <div class="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700/50 dark:bg-gray-900">
          <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-50 dark:bg-red-950">
            <UIcon name="i-lucide-alarm-clock" class="h-5 w-5 text-red-500 dark:text-red-400" />
          </div>
          <div>
            <p class="text-xs text-gray-500 dark:text-gray-400">Selesai Sesi</p>
            <p class="text-sm font-semibold text-gray-900 dark:text-gray-100">{{ fmtDateTime(session.ends_at) }}</p>
          </div>
        </div>
      </div>

      <div class="mt-6">
        <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Absensi</h2>
          <div class="flex items-center gap-3">
            <div
              v-if="canRecord"
              class="flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-medium text-teal-700 dark:border-teal-800 dark:bg-teal-950 dark:text-teal-300"
              title="Data absensi otomatis dimuat ulang"
            >
              <UIcon
                name="i-lucide-loader-circle"
                class="h-4 w-4 animate-spin"
              />
              Auto-refresh
              <span class="font-bold tabular-nums">{{ countdown }}s</span>
            </div>
            <UButton
              v-if="can('manage_akademik') && canRecord"
              icon="i-lucide-plus"
              size="sm"
              class="bg-teal-600 text-white hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-400"
              @click="recorderOpen = true"
            >
              Catat Absensi
            </UButton>
          </div>
        </div>

        <p v-if="!canRecord" class="mb-3 text-xs text-gray-500 dark:text-gray-400">
          {{ session?.status === 'scheduled' ? 'Buka sesi terlebih dahulu untuk mencatat absensi.' : 'Absensi terkunci karena sesi sudah selesai/dibatalkan.' }}
        </p>

        <AdminAkademikAttendanceList
          :session-id="id"
          :data="store.attendances"
          :loading="store.isLoading"
          :disabled="!canRecord"
          @changed="onAttendanceChanged"
        />

        <div v-if="store.attendances.length === 0 && !store.isLoading" class="mt-3 rounded-lg border border-dashed border-gray-300 p-4 text-center text-sm text-gray-500 dark:border-gray-600 dark:text-gray-400">
          Belum ada absensi untuk sesi ini.
        </div>
      </div>
    </template>

    <AdminAkademikAttendanceRecorder
      v-model:open="recorderOpen"
      :session-id="id"
      @success="onAttendanceChanged"
    />

    <AdminConfirmActionModal
      :open="confirmOpen"
      :title="confirmTitle"
      :message="confirmMessage"
      confirm-label="Ya, Lanjutkan"
      :loading="confirmRunning"
      @update:open="confirmOpen = $event"
      @confirm="confirmRun"
    />

    <UModal v-model:open="syncOpen">
      <template #content>
        <div class="p-6">
          <div class="mb-5 flex items-center justify-between">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Hasil Sinkronisasi Fingerprint</h3>
            <UButton
              color="neutral"
              variant="ghost"
              icon="i-lucide-x"
              size="sm"
              square
              @click="syncOpen = false"
            />
          </div>

          <div v-if="syncResult" class="grid grid-cols-3 gap-3">
            <div class="rounded-lg border border-gray-200 bg-gray-50 p-4 text-center dark:border-gray-700/50 dark:bg-gray-800">
              <p class="text-2xl font-bold text-gray-900 dark:text-gray-100">{{ syncResult.total_scans }}</p>
              <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">Total Scan</p>
            </div>
            <div class="rounded-lg border border-green-200 bg-green-50 p-4 text-center dark:border-green-900 dark:bg-green-950">
              <p class="text-2xl font-bold text-green-600 dark:text-green-400">{{ syncResult.recorded }}</p>
              <p class="mt-1 text-xs text-green-600 dark:text-green-400">Tercatat</p>
            </div>
            <div class="rounded-lg border border-amber-200 bg-amber-50 p-4 text-center dark:border-amber-900 dark:bg-amber-950">
              <p class="text-2xl font-bold text-amber-600 dark:text-amber-400">{{ syncResult.skipped }}</p>
              <p class="mt-1 text-xs text-amber-600 dark:text-amber-400">Dilewati</p>
            </div>
          </div>

          <div class="mt-4">
            <p class="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              Scan gagal ({{ syncResult?.errors?.length ?? 0 }})
            </p>
            <div v-if="(syncResult?.errors?.length ?? 0) > 0" class="max-h-64 space-y-2 overflow-y-auto pr-1">
              <div
                v-for="(e, i) in syncResult?.errors ?? []"
                :key="i"
                class="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 dark:border-red-900 dark:bg-red-950"
              >
                <UIcon name="i-lucide-circle-x" class="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                <div class="min-w-0">
                  <p class="font-mono text-sm font-medium text-gray-900 dark:text-gray-100">{{ e.pin }}</p>
                  <p class="text-xs text-gray-600 dark:text-gray-400">{{ e.reason }}</p>
                </div>
              </div>
            </div>
            <p v-else class="rounded-lg border border-dashed border-gray-300 p-3 text-center text-sm text-gray-500 dark:border-gray-600 dark:text-gray-400">
              Semua scan berhasil diproses.
            </p>
          </div>

          <div class="mt-5 flex justify-end gap-2 border-t border-gray-200 pt-4 dark:border-gray-700">
            <UButton color="primary" @click="syncOpen = false">Tutup</UButton>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>
