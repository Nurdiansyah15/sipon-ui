<script setup lang="ts">
import type { TableColumn, DropdownMenuItem } from '@nuxt/ui'
import type { ApiSuccess } from '#shared/types/ApiResponse'
import { useAkademikStore } from '~/stores/akademik'
import { usePermission } from '~/composables/usePermission'
import type { ActivityPeriod, ActivitySchedule } from '#shared/types/Akademik'

definePageMeta({ layout: 'akademik' })

const route = useRoute()
const id = computed(() => (route.params as Record<string, string>).id ?? '')

const store = useAkademikStore()
const toast = useToast()
const { can } = usePermission()

const loading = ref(true)
const notFound = ref(false)
const period = ref<ActivityPeriod | null>(null)

async function load() {
  loading.value = true
  notFound.value = false
  try {
    const res = await useApi().get<ApiSuccess<ActivityPeriod[]>>('/api/v1/web/akademik/activity-periods', {
      query: { page: 1, limit: 100 },
    })
    period.value = res.data.find(p => p.id === id.value) ?? null
    if (!period.value) {
      notFound.value = true
      return
    }
    await Promise.all([
      store.fetchPeriodPrograms(id.value),
      store.fetchSchedules(id.value),
    ])
  } catch {
    notFound.value = true
  } finally {
    loading.value = false
  }
}

onMounted(load)

const scheduleColumns: TableColumn<ActivitySchedule>[] = [
  { accessorKey: 'type', header: 'Tipe' },
  { accessorKey: 'start_time', header: 'Waktu' },
  { accessorKey: 'start_date', header: 'Berlaku' },
  { id: 'actions', header: '' },
]

function fmtTime(v: string) {
  return v.slice(0, 5)
}

function fmtDate(v: string | undefined) {
  if (!v) return '-'
  return new Date(v).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
}

const scheduleFormOpen = ref(false)
const editSchedule = ref<ActivitySchedule | null>(null)

function openCreateSchedule() {
  editSchedule.value = null
  scheduleFormOpen.value = true
}

function openEditSchedule(row: ActivitySchedule) {
  editSchedule.value = row
  scheduleFormOpen.value = true
}

const deleteOpen = ref(false)
const deleteTarget = ref<ActivitySchedule | null>(null)
const deleteRunning = ref(false)

function openDeleteSchedule(row: ActivitySchedule) {
  deleteTarget.value = row
  deleteOpen.value = true
}

async function confirmDeleteSchedule() {
  if (!deleteTarget.value) return
  deleteRunning.value = true
  try {
    await store.deleteSchedule(deleteTarget.value.id)
    toast.add({ title: 'Jadwal dihapus', color: 'success' })
    deleteOpen.value = false
    await store.fetchSchedules(id.value)
  } catch {
    toast.add({ title: store.error ?? 'Gagal menghapus jadwal', color: 'error' })
  } finally {
    deleteRunning.value = false
  }
}

function scheduleActions(row: ActivitySchedule): DropdownMenuItem[] {
  return [
    { label: 'Lihat', icon: 'i-lucide-eye', onSelect: () => navigateTo(`/admin/akademik/jadwal/${row.id}`) },
    { label: 'Edit', icon: 'i-lucide-pencil', onSelect: () => openEditSchedule(row) },
    { type: 'separator' },
    { label: 'Hapus', icon: 'i-lucide-trash-2', color: 'error', onSelect: () => openDeleteSchedule(row) },
  ]
}

const statusConfirmOpen = ref(false)
const statusConfirmTitle = ref('')
const statusConfirmMessage = ref('')
const statusAction = ref<'activate' | 'deactivate'>('activate')
const statusRunning = ref(false)

async function confirmStatusChange() {
  if (!period.value) return
  statusRunning.value = true
  try {
    if (statusAction.value === 'activate') {
      await store.activateActivityPeriod(period.value.id)
      toast.add({ title: 'Kegiatan diaktifkan', color: 'success' })
    } else {
      await store.deactivateActivityPeriod(period.value.id)
      toast.add({ title: 'Kegiatan dinonaktifkan', color: 'success' })
    }
    statusConfirmOpen.value = false
    await load()
  } catch {
    toast.add({ title: store.error ?? 'Gagal mengubah status', color: 'error' })
  } finally {
    statusRunning.value = false
  }
}

function requestStatusChange(action: 'activate' | 'deactivate') {
  statusAction.value = action
  statusConfirmTitle.value = action === 'activate' ? 'Aktifkan Kegiatan' : 'Nonaktifkan Kegiatan'
  statusConfirmMessage.value = action === 'activate'
    ? 'Aktifkan kegiatan ini pada periode tersebut?'
    : 'Nonaktifkan kegiatan ini pada periode tersebut?'
  statusConfirmOpen.value = true
}

async function reloadPrograms() {
  await store.fetchPeriodPrograms(id.value)
}
</script>

<template>
  <div class="mx-auto max-w-7xl px-4 py-8">
      <div class="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {{ period?.activity_name ?? 'Detail Aktivasi' }}
          </h1>
          <p v-if="period" class="mt-1 text-sm text-gray-700 dark:text-gray-300">
            {{ period.activity_code }} · {{ period.period_name }}
          </p>
        </div>
        <div v-if="period" class="flex items-center gap-2">
          <UButton
            to="/admin/akademik/aktivasi"
            icon="i-lucide-arrow-left"
            color="neutral"
            variant="outline"
          >
            Kembali
          </UButton>
          <AkademikStatusBadge :status="period.status" type="activity_period" />
          <UButton
            v-if="period.status === 'active'"
            color="warning"
            variant="outline"
            icon="i-lucide-pause"
            @click="requestStatusChange('deactivate')"
          >
            Nonaktifkan
          </UButton>
          <UButton
            v-else
            color="success"
            variant="outline"
            icon="i-lucide-play"
            @click="requestStatusChange('activate')"
          >
            Aktifkan
          </UButton>
        </div>
      </div>

    <div v-if="loading" class="flex justify-center py-16">
      <UIcon name="i-lucide-loader-circle" class="h-8 w-8 animate-spin text-teal-600" />
    </div>

    <div v-else-if="notFound || !period" class="rounded-lg border border-dashed border-gray-300 p-8 text-center text-gray-500 dark:border-gray-600 dark:text-gray-400">
      Aktivasi kegiatan tidak ditemukan.
    </div>

    <template v-else>
      <!-- Program Scope -->
      <div class="mb-8">
        <AdminAkademikProgramScopeManager
          :activity-period-id="period.id"
          :programs="store.periodPrograms"
          @changed="reloadPrograms"
        />
      </div>

      <!-- Schedules -->
      <div>
        <div class="mb-3 flex items-center justify-between">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Jadwal Kegiatan</h2>
          <UButton
            v-if="can('manage_akademik')"
            icon="i-lucide-plus"
            size="sm"
            class="bg-teal-600 text-white hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-400"
            @click="openCreateSchedule"
          >
            Tambah Jadwal
          </UButton>
        </div>

        <div class="overflow-x-auto rounded-lg border border-gray-200 bg-white dark:border-gray-700/50 dark:bg-gray-900">
          <UTable
            :data="store.schedules"
            :columns="scheduleColumns"
            :loading="store.isLoading"
            class="w-full"
            :ui="{ th: 'text-gray-900 font-bold dark:text-gray-100' }"
          >
            <template #type-cell="{ row }">
              <AkademikScheduleTypeBadge :type="row.original.type" />
            </template>

            <template #start_time-cell="{ row }">
              <AkademikTimeDisplay :start-time="row.original.start_time" :end-time="row.original.end_time" />
            </template>

            <template #start_date-cell="{ row }">
              <span class="text-sm text-gray-700 dark:text-gray-300">
                {{ fmtDate(row.original.start_date) }} → {{ fmtDate(row.original.end_date) }}
              </span>
            </template>

            <template #actions-cell="{ row }">
              <AppRowActions v-if="can('manage_akademik')" :items="scheduleActions(row.original)" />
            </template>
          </UTable>
        </div>

        <div v-if="store.schedules.length === 0 && !store.isLoading" class="mt-3 rounded-lg border border-dashed border-gray-300 p-4 text-center text-sm text-gray-500 dark:border-gray-600 dark:text-gray-400">
          Belum ada jadwal. Tambahkan jadwal untuk menentukan pola pelaksanaan kegiatan ini.
        </div>
      </div>
    </template>

    <AdminAkademikScheduleFormModal
      v-model:open="scheduleFormOpen"
      :activity-period-id="id"
      :schedule="editSchedule"
      @success="store.fetchSchedules(id)"
    />

    <AdminConfirmActionModal
      :open="deleteOpen"
      title="Hapus Jadwal"
      :message="`Yakin ingin menghapus jadwal ini?`"
      confirm-label="Hapus"
      confirm-color="error"
      :loading="deleteRunning"
      @update:open="deleteOpen = $event"
      @confirm="confirmDeleteSchedule"
    />

    <AdminConfirmActionModal
      :open="statusConfirmOpen"
      :title="statusConfirmTitle"
      :message="statusConfirmMessage"
      confirm-label="Ya, Lanjutkan"
      :loading="statusRunning"
      @update:open="statusConfirmOpen = $event"
      @confirm="confirmStatusChange"
    />
  </div>
</template>
