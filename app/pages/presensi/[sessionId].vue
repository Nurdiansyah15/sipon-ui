<script setup lang="ts">
import { useAkademikSantriStore } from '~/stores/akademik-santri'
import { parseApiError, getErrorStatus } from '~/utils/errorParser'
import { MONTH_LABEL, scheduleTypeLabel } from '~/utils/akademikSchedule'
import type { PresensiSessionInfo, PresensiAttendanceItem } from '#shared/types/AkademikSantri'

definePageMeta({ layout: 'default' })

const route = useRoute()
const sessionId = computed(() => (route.params as Record<string, string>).sessionId ?? '')

const store = useAkademikSantriStore()

const loading = ref(true)
const notFound = ref(false)
const session = ref<PresensiSessionInfo | null>(null)
const attendees = ref<PresensiAttendanceItem[]>([])
const nis = ref('')
const checking = ref(false)
const feedback = ref<{ type: 'success' | 'error'; text: string } | null>(null)
const nisInput = ref<{ inputRef?: HTMLInputElement | null } | null>(null)

async function loadInfo() {
  try {
    session.value = await store.fetchPresensiSessionInfo(sessionId.value)
  } catch (err) {
    if (getErrorStatus(err) === 404) {
      notFound.value = true
    }
    feedback.value = { type: 'error', text: parseApiError(err, 'Gagal memuat info presensi.') }
  } finally {
    loading.value = false
  }
}

async function loadAttendance() {
  try {
    attendees.value = await store.fetchPresensiAttendance(sessionId.value)
  } catch {
    // polling refresh — abaikan error sesaat
  }
}

async function handleCheckin() {
  const value = nis.value.trim()
  if (!value) return
  checking.value = true
  feedback.value = null
  try {
    const res = await store.checkinPresensi(sessionId.value, value)
    feedback.value = { type: 'success', text: res.message }
    nis.value = ''
    await Promise.all([loadInfo(), loadAttendance()])
    nisInput.value?.inputRef?.focus()
  } catch (err) {
    feedback.value = { type: 'error', text: parseApiError(err, 'Kehadiran gagal dicatat.') }
  } finally {
    checking.value = false
  }
}

function fmtDateTime(iso: string) {
  const d = new Date(iso)
  const dow = DAY_LABEL[d.getDay()]
  return `${dow}, ${d.getDate()} ${MONTH_LABEL[d.getMonth()]} ${d.getFullYear()} · ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

const DAY_LABEL = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']

const isOpen = computed(() => session.value?.status === 'open')

onMounted(async () => {
  await loadInfo()
  await loadAttendance()
  nisInput.value?.inputRef?.focus()

  // Polling ringan untuk refresh daftar hadir.
  const timer = setInterval(() => {
    if (document.visibilityState === 'visible') loadAttendance()
  }, 5000)
  onUnmounted(() => clearInterval(timer))
})
</script>

<template>
  <div class="mx-auto max-w-2xl px-4 py-10">
    <div v-if="loading" class="space-y-4">
      <USkeleton class="h-40 w-full" />
      <USkeleton class="h-24 w-full" />
    </div>

    <div v-else-if="notFound" class="rounded-lg border border-gray-200 bg-white p-10 text-center dark:border-gray-700/50 dark:bg-gray-900">
      <UIcon name="i-lucide-search-x" class="mx-auto mb-3 h-12 w-12 text-gray-300" />
      <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Sesi Tidak Ditemukan</h2>
    </div>

    <template v-else-if="session">
      <div class="mb-6 text-center">
        <p class="text-sm font-semibold uppercase tracking-widest text-teal-600 dark:text-teal-400">Presensi</p>
        <h1 class="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100">{{ session.activity_name }}</h1>
        <p class="mt-1 text-sm text-gray-500">
          {{ session.activity_code }} · {{ scheduleTypeLabel(session.schedule_type) }}
        </p>
      </div>

      <!-- Info sesi -->
      <div class="mb-5 rounded-lg border border-gray-200 bg-white p-5 text-center dark:border-gray-700/50 dark:bg-gray-900">
        <p class="text-sm text-gray-600 dark:text-gray-300">{{ fmtDateTime(session.starts_at) }}</p>
        <p v-if="session.period_name" class="mt-1 text-xs text-gray-400">{{ session.period_name }}</p>
        <div class="mt-3 inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium"
          :class="isOpen ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300' : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'">
          <span class="h-2 w-2 rounded-full" :class="isOpen ? 'bg-green-500' : 'bg-gray-400'" />
          {{ isOpen ? 'Sesi Berlangsung' : 'Sesi Ditutup' }}
        </div>
        <p class="mt-3 text-sm text-gray-700 dark:text-gray-300">
          Kehadiran: <span class="font-semibold">{{ session.total_present }}</span> / {{ session.total_eligible }}
        </p>
      </div>

      <!-- Input NIS -->
      <div class="mb-6 rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700/50 dark:bg-gray-900">
        <p class="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">Masukkan NIS Anda lalu tekan Enter</p>
        <form class="flex gap-2" @submit.prevent="handleCheckin">
          <UInput
            ref="nisInput"
            v-model="nis"
            type="text"
            inputmode="numeric"
            autocomplete="off"
            placeholder="cth. 1000126001"
            class="flex-1"
            size="lg"
            :disabled="!isOpen || checking"
          />
          <UButton
            type="submit"
            size="lg"
            icon="i-lucide-check"
            class="bg-teal-600 text-white hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-400"
            :loading="checking"
            :disabled="!isOpen || !nis.trim()"
          >
            Hadir
          </UButton>
        </form>

        <div v-if="feedback" class="mt-4 rounded-lg px-3 py-2 text-sm"
          :class="feedback.type === 'success'
            ? 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300'
            : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'">
          {{ feedback.text }}
        </div>
      </div>

      <!-- Daftar hadir -->
      <div class="rounded-lg border border-gray-200 bg-white dark:border-gray-700/50 dark:bg-gray-900">
        <div class="border-b border-gray-200 px-5 py-3 dark:border-gray-700/50">
          <h2 class="font-semibold text-gray-900 dark:text-gray-100">Sudah Hadir ({{ attendees.length }})</h2>
        </div>
        <div v-if="attendees.length === 0" class="p-6 text-center text-sm text-gray-500">
          Belum ada kehadiran tercatat.
        </div>
        <ul v-else class="divide-y divide-gray-100 dark:divide-gray-700/50">
          <li
            v-for="(a, i) in attendees"
            :key="a.santri_id"
            class="flex items-center gap-3 px-5 py-3"
          >
            <span class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-teal-50 text-xs font-semibold text-teal-600 dark:bg-teal-950 dark:text-teal-400">
              {{ i + 1 }}
            </span>
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-medium text-gray-900 dark:text-gray-100">{{ a.fullname || '-' }}</p>
              <p class="text-xs text-gray-400">{{ a.nis || '-' }}</p>
            </div>
            <span class="text-xs text-gray-400">
              {{ new Date(a.recorded_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) }}
            </span>
          </li>
        </ul>
      </div>
    </template>
  </div>
</template>
