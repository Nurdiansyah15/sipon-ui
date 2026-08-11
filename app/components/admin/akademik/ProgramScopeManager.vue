<script setup lang="ts">
import type { ApiSuccess } from '#shared/types/ApiResponse'
import type { ActivityPeriodProgram, Program } from '#shared/types/Akademik'
import { useAkademikStore } from '~/stores/akademik'

const props = defineProps<{
  activityPeriodId: string
  programs: ActivityPeriodProgram[]
}>()

const emit = defineEmits<{
  changed: []
}>()

const store = useAkademikStore()
const toast = useToast()

const assignOpen = ref(false)
const selectedProgramId = ref('')
const availablePrograms = ref<Program[]>([])
const loading = ref(false)
const statusFilter = ref<'active' | 'inactive' | 'all'>('active')
const isSubmitting = computed(() => store.isSubmitting)

async function openAssign() {
  selectedProgramId.value = ''
  statusFilter.value = 'active'
  assignOpen.value = true
  await loadAvailablePrograms()
}

async function loadAvailablePrograms() {
  loading.value = true
  try {
    const api = useApi()
    const res = await api.get<ApiSuccess<Program[]>>('/api/v1/web/akademik/programs', {
      query: { limit: 100, status: statusFilter.value === 'all' ? undefined : statusFilter.value },
    })
    const assigned = new Set(props.programs.map(p => p.program_id))
    availablePrograms.value = res.data.filter(p => !assigned.has(p.id))
  } catch {
    availablePrograms.value = []
  } finally {
    loading.value = false
  }
}

function onStatusFilterChange() {
  selectedProgramId.value = ''
  loadAvailablePrograms()
}

async function confirmAssign() {
  if (!selectedProgramId.value) return
  try {
    await store.assignProgram(props.activityPeriodId, { program_id: selectedProgramId.value })
    toast.add({ title: 'Program ditambahkan', color: 'success' })
    assignOpen.value = false
    emit('changed')
  } catch {
    toast.add({ title: store.error ?? 'Gagal menambahkan program', color: 'error' })
  }
}

const removeTarget = ref<ActivityPeriodProgram | null>(null)
const removeOpen = ref(false)
const removing = ref(false)

function openRemove(p: ActivityPeriodProgram) {
  removeTarget.value = p
  removeOpen.value = true
}

async function confirmRemove() {
  if (!removeTarget.value) return
  removing.value = true
  try {
    await store.removeProgram(props.activityPeriodId, removeTarget.value.program_id)
    toast.add({ title: 'Program dihapus', color: 'success' })
    removeOpen.value = false
    emit('changed')
  } catch {
    toast.add({ title: store.error ?? 'Gagal menghapus program', color: 'error' })
  } finally {
    removing.value = false
  }
}

const showAll = computed(() => props.programs.length === 0)
</script>

<template>
  <div>
    <div class="mb-3 flex items-center justify-between">
      <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Program Berlaku</h2>
      <UButton
        icon="i-lucide-plus"
        size="sm"
        class="bg-teal-600 text-white hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-400"
        @click="openAssign"
      >
        Tambah Program
      </UButton>
    </div>

    <div v-if="showAll" class="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-600 dark:border-gray-600 dark:bg-gray-800/50 dark:text-gray-300">
      Berlaku untuk <span class="font-semibold">Semua Program</span> — tanpa scope program, kegiatan ini diikuti seluruh santri.
    </div>

    <div v-else class="flex flex-wrap gap-2">
      <div
        v-for="p in programs"
        :key="p.id"
        class="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 dark:border-gray-700/50 dark:bg-gray-900"
      >
        <UIcon name="i-lucide-graduation-cap" class="h-4 w-4 text-teal-600 dark:text-teal-400" />
        <span class="text-sm font-medium text-gray-900 dark:text-gray-100">{{ p.program_name }}</span>
        <span class="text-xs text-gray-400">{{ p.program_code }}</span>
        <UButton color="error" variant="ghost" size="xs" icon="i-lucide-x" square @click="openRemove(p)" />
      </div>
    </div>

    <!-- Assign modal -->
    <UModal :open="assignOpen" @update:open="assignOpen = $event">
      <template #content>
        <div class="p-6">
          <div class="mb-5 flex items-center justify-between">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Tambahkan Program</h3>
            <UButton color="neutral" variant="ghost" icon="i-lucide-x" size="sm" square @click="assignOpen = false" />
          </div>
          <div class="mb-3">
            <UFormField label="Status Program" hint="Tampilkan program berdasarkan status">
              <USelect
                v-model="statusFilter"
                :items="[
                  { label: 'Aktif', value: 'active' },
                  { label: 'Non Aktif', value: 'inactive' },
                  { label: 'Semua', value: 'all' },
                ]"
                variant="subtle"
                class="w-full"
                @update:model-value="onStatusFilterChange"
              />
            </UFormField>
          </div>
          <USelect
            v-model="selectedProgramId"
            :items="availablePrograms.map(p => ({ label: `${p.code} — ${p.name}`, value: p.id }))"
            :loading="loading"
            placeholder="Pilih program"
            searchable
            class="w-full"
          />
          <div class="mt-5 flex justify-end gap-2 border-t border-gray-200 pt-4 dark:border-gray-700">
            <UButton color="neutral" variant="outline" @click="assignOpen = false">Batal</UButton>
            <UButton :loading="isSubmitting" color="primary" @click="confirmAssign">Tambahkan</UButton>
          </div>
        </div>
      </template>
    </UModal>

    <!-- Remove confirm -->
    <AdminConfirmActionModal
      :open="removeOpen"
      title="Hapus Program"
      :message="`Yakin ingin menghapus program '${removeTarget?.program_name ?? ''}' dari scope kegiatan ini?`"
      confirm-label="Hapus"
      confirm-color="error"
      :loading="removing"
      @update:open="removeOpen = $event"
      @confirm="confirmRemove"
    />
  </div>
</template>
