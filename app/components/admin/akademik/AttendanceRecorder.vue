<script setup lang="ts">
import type { AttendanceStatus, EligibleSantri } from '#shared/types/Akademik'
import { useAkademikStore } from '~/stores/akademik'

const props = defineProps<{
  open: boolean
  sessionId: string
}>()

const emit = defineEmits<{
  'update:open': [boolean]
  success: []
}>()

const store = useAkademikStore()
const toast = useToast()

const isSubmitting = computed(() => store.isSubmitting)

const statusOptions: { label: string; value: AttendanceStatus }[] = [
  { label: 'Hadir', value: 'present' },
  { label: 'Alpa', value: 'absent' },
  { label: 'Izin', value: 'excused' },
]

interface Row {
  santri_id: string
  label: string
  status: AttendanceStatus
}

const rows = ref<Row[]>([])
const loadingSantri = ref(false)
const search = ref('')

const available = ref<EligibleSantri[]>([])

const displayRows = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return rows.value
  return rows.value.filter((r) => r.label.toLowerCase().includes(q))
})

async function loadSantri() {
  loadingSantri.value = true
  search.value = ''
  try {
    const eligible = await store.fetchEligibleSantri(props.sessionId)
    const existing = new Set(store.attendances.map(a => a.santri_id))
    available.value = eligible.filter(s => !existing.has(s.santri_id))
    rows.value = available.value.map(s => ({
      santri_id: s.santri_id,
      label: s.fullname ? `${s.fullname} (${s.nis ?? '-'})` : (s.nis ?? s.santri_id.slice(0, 8)),
      status: 'present' as AttendanceStatus,
    }))
  } catch {
    available.value = []
    rows.value = []
  } finally {
    loadingSantri.value = false
  }
}

watch(() => props.open, (val) => {
  if (val) loadSantri()
})

function markAll(status: AttendanceStatus) {
  rows.value.forEach((r) => { r.status = status })
}

function hasNoSantri() {
  return !loadingSantri.value && available.value.length === 0
}

async function onSubmit() {
  if (rows.value.length === 0) return
  try {
    await store.recordAttendance(props.sessionId, {
      records: rows.value.map(r => ({ santri_id: r.santri_id, status: r.status })),
    })
    toast.add({ title: `Absensi dicatat untuk ${rows.value.length} santri`, color: 'success' })
    emit('update:open', false)
    emit('success')
  } catch {
    toast.add({ title: store.error ?? 'Gagal mencatat absensi', color: 'error' })
  }
}
</script>

<template>
  <UModal :open="open" :dismissible="!isSubmitting" @update:open="v => !isSubmitting && emit('update:open', v)">
    <template #content>
      <div class="p-6">
        <div class="mb-5 flex items-center justify-between">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Catat Absensi</h3>
          <UButton
            v-if="!isSubmitting"
            color="neutral"
            variant="ghost"
            icon="i-lucide-x"
            size="sm"
            square
            @click="emit('update:open', false)"
          />
        </div>

        <div class="mb-4 flex flex-wrap items-center gap-2">
          <span class="text-sm text-gray-500 dark:text-gray-400">Tandai semua:</span>
          <UButton v-for="opt in statusOptions" :key="opt.value" size="xs" color="neutral" variant="outline" @click="markAll(opt.value)">
            {{ opt.label }}
          </UButton>
        </div>

        <div v-if="loadingSantri" class="flex justify-center py-8">
          <UIcon name="i-lucide-loader-circle" class="h-6 w-6 animate-spin text-teal-600" />
        </div>

        <div v-else-if="hasNoSantri()" class="rounded-lg border border-dashed border-gray-300 p-4 text-center text-sm text-gray-500 dark:border-gray-600 dark:text-gray-400">
          Tidak ada santri berhak absen yang belum dicatat. Pastikan santri sudah herregistrasi pada periode akademik sesi ini.
        </div>

        <template v-else>
          <p class="mb-2 text-xs text-gray-500 dark:text-gray-400">
            {{ rows.length }} santri berhak absen · status default Hadir, sesuaikan bila ada yang alpa/izin.
          </p>

          <UInput v-model="search" placeholder="Cari nama / NIS..." class="mb-3" size="sm" />

          <div v-if="displayRows.length === 0" class="rounded-lg border border-dashed border-gray-300 p-4 text-center text-sm text-gray-500 dark:border-gray-600 dark:text-gray-400">
            Tidak ada santri yang cocok.
          </div>

          <div v-else class="max-h-96 space-y-2 overflow-y-auto pr-1">
            <div
              v-for="row in displayRows"
              :key="row.santri_id"
              class="flex items-center justify-between gap-2 rounded-lg border border-gray-200 px-3 py-2 dark:border-gray-700/50"
            >
              <span class="min-w-0 truncate text-sm font-medium text-gray-900 dark:text-gray-100">{{ row.label }}</span>
              <USelect
                :model-value="row.status"
                :items="statusOptions"
                class="w-28 shrink-0"
                size="sm"
                @update:model-value="row.status = $event as AttendanceStatus"
              />
            </div>
          </div>
        </template>

        <div class="mt-5 flex justify-end gap-2 border-t border-gray-200 pt-4 dark:border-gray-700">
          <UButton color="neutral" variant="outline" :disabled="isSubmitting" @click="emit('update:open', false)">
            Batal
          </UButton>
          <UButton :loading="isSubmitting" :disabled="rows.length === 0" color="primary" @click="onSubmit">
            Simpan Absensi
          </UButton>
        </div>
      </div>
    </template>
  </UModal>
</template>
