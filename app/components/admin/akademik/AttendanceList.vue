<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { Attendance, AttendanceStatus } from '#shared/types/Akademik'
import { useAkademikStore } from '~/stores/akademik'

const props = defineProps<{
  sessionId: string
  data: Attendance[]
  loading: boolean
}>()

const emit = defineEmits<{
  changed: []
}>()

const store = useAkademikStore()
const toast = useToast()

const columns: TableColumn<Attendance>[] = [
  { accessorKey: 'santri_nis', header: 'NIS' },
  { accessorKey: 'santri_id', header: 'Santri' },
  { accessorKey: 'status', header: 'Status' },
  { accessorKey: 'recorded_at', header: 'Dicatat' },
]

function shortID(id: string) {
  return id.slice(0, 8)
}

const statusOptions: { label: string; value: AttendanceStatus }[] = [
  { label: 'Hadir', value: 'present' },
  { label: 'Alpa', value: 'absent' },
  { label: 'Izin', value: 'excused' },
]

async function changeStatus(row: Attendance, status: AttendanceStatus) {
  try {
    await store.updateAttendance(props.sessionId, row.santri_id, { status })
    toast.add({ title: 'Status absensi diperbarui', color: 'success' })
    emit('changed')
  } catch {
    toast.add({ title: store.error ?? 'Gagal memperbarui absensi', color: 'error' })
  }
}

function fmtDate(v: string) {
  return new Date(v).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}
</script>

<template>
  <div class="overflow-x-auto rounded-lg border border-gray-200 bg-white dark:border-gray-700/50 dark:bg-gray-900">
    <UTable
      :data="data"
      :columns="columns"
      :loading="loading"
      class="w-full"
      :ui="{ th: 'text-gray-900 font-bold dark:text-gray-100' }"
    >
      <template #santri_id-cell="{ row }">
        <span class="font-mono text-xs text-gray-500 dark:text-gray-400">{{ shortID(row.original.santri_id) }}</span>
      </template>

      <template #status-cell="{ row }">
        <USelect
          :model-value="row.original.status"
          :items="statusOptions"
          size="sm"
          class="w-28"
          :loading="store.isSubmitting"
          @update:model-value="v => changeStatus(row.original, v as AttendanceStatus)"
        />
      </template>

      <template #recorded_at-cell="{ row }">
        <span class="text-sm text-gray-700 dark:text-gray-300">{{ fmtDate(row.original.recorded_at) }}</span>
      </template>
    </UTable>
  </div>
</template>
