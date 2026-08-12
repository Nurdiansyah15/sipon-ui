<script setup lang="ts">
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

async function load() {
  loading.value = true
  notFound.value = false
  try {
    session.value = await store.fetchSession(id.value)
  } catch {
    notFound.value = true
  } finally {
    loading.value = false
  }
}

async function loadAttendance() {
  try {
    await store.fetchAttendance(id.value)
  } catch {
    // ignore — error in store
  }
}

onMounted(async () => {
  await load()
  if (session.value) await loadAttendance()
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
            {{ session.activity_code }} · {{ fmtDateTime(session.starts_at) }}
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

      <div class="mt-6">
        <div class="mb-3 flex items-center justify-between">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Absensi</h2>
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
  </div>
</template>
