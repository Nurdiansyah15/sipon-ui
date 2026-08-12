<script setup lang="ts">
import { useAkademikStore } from '~/stores/akademik'
import { useAkademikPeriodContext } from '~/composables/useAkademikPeriodContext'
import { parseApiError } from '~/utils/errorParser'
import type { HerregistrasiDocumentRequirement } from '#shared/types/AkademikSantri'

definePageMeta({ layout: 'akademik' })

const store = useAkademikStore()
const toast = useToast()
const { selectedPeriodId, loadPeriods } = useAkademikPeriodContext()

const addOpen = ref(false)
const editing = ref<HerregistrasiDocumentRequirement | null>(null)

const formOpen = computed({
  get: () => addOpen.value || editing.value !== null,
  set: (v: boolean) => {
    if (!v) {
      addOpen.value = false
      editing.value = null
    }
  },
})

async function load() {
  if (!selectedPeriodId.value) return
  try {
    await store.fetchPeriodDocRequirements(selectedPeriodId.value)
  } catch (err) {
    toast.add({ title: 'Gagal memuat data', description: parseApiError(err), color: 'error' })
  }
}

async function toggleRequired(req: HerregistrasiDocumentRequirement) {
  try {
    await store.updateDocRequirement(req.id, { is_required: !req.is_required })
    toast.add({ title: 'Status dokumen diperbarui', color: 'success' })
    await load()
  } catch (err) {
    toast.add({ title: 'Gagal memperbarui dokumen', description: parseApiError(err), color: 'error' })
  }
}

async function removeRequirement(req: HerregistrasiDocumentRequirement) {
  try {
    await store.deleteDocRequirement(req.id)
    toast.add({ title: 'Dokumen berhasil dihapus', color: 'success' })
    await load()
  } catch (err) {
    toast.add({ title: 'Gagal menghapus dokumen', description: parseApiError(err), color: 'error' })
  }
}

onMounted(() => {
  loadPeriods()
  load()
})

watch(selectedPeriodId, () => load())
</script>

<template>
  <AkademikPeriodGuard v-if="!selectedPeriodId" />
  <template v-else>
    <div class="mx-auto max-w-4xl px-4 py-8">
      <div class="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Dokumen Herregistrasi</h1>
          <p class="mt-1 text-sm text-gray-700 dark:text-gray-300">
            Atur dokumen yang boleh/wajib di-upload santri pada periode ini.
          </p>
        </div>
        <div class="flex items-center gap-2">
          <UButton to="/admin/akademik/herregistrasi" icon="i-lucide-arrow-left" color="neutral" variant="outline">
            Kembali
          </UButton>
          <UButton icon="i-lucide-plus" class="bg-teal-600 text-white hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-400" @click="addOpen = true">
            Tambah Dokumen
          </UButton>
        </div>
      </div>

      <p v-if="store.isLoading" class="text-sm text-gray-500">Memuat...</p>

      <div v-else-if="store.periodDocRequirements.length === 0" class="rounded-lg border border-gray-200 bg-white p-10 text-center dark:border-gray-700/50 dark:bg-gray-900">
        <UIcon name="i-lucide-files" class="mx-auto mb-3 h-12 w-12 text-gray-300 dark:text-gray-600" />
        <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Belum Ada Dokumen</h2>
        <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">Tambahkan dokumen yang dibutuhkan santri untuk herregistrasi pada periode ini.</p>
      </div>

      <div v-else class="space-y-3">
        <div
          v-for="req in store.periodDocRequirements"
          :key="req.id"
          class="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700/50 dark:bg-gray-900"
        >
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2">
              <p class="font-medium text-gray-900 dark:text-gray-100">{{ req.label }}</p>
              <UBadge :color="req.is_required ? 'error' : 'neutral'" variant="subtle" size="xs">
                {{ req.is_required ? 'Wajib' : 'Opsional' }}
              </UBadge>
            </div>
            <p class="mt-0.5 text-xs text-gray-400 dark:text-gray-500">{{ req.kind }}</p>
            <p v-if="req.description" class="mt-1 text-xs text-gray-500 dark:text-gray-400">{{ req.description }}</p>
          </div>

          <div class="flex shrink-0 items-center gap-2">
            <UButton
              variant="outline"
              size="xs"
              :icon="req.is_required ? 'i-lucide-circle-check' : 'i-lucide-circle'"
              @click="toggleRequired(req)"
            >
              {{ req.is_required ? 'Wajib' : 'Opsional' }}
            </UButton>
            <UButton variant="ghost" size="xs" icon="i-lucide-pencil" @click="editing = req">
              Edit
            </UButton>
            <UButton variant="ghost" size="xs" color="error" icon="i-lucide-trash-2" @click="removeRequirement(req)">
              Hapus
            </UButton>
          </div>
        </div>
      </div>
    </div>
  </template>

  <AdminAkademikDocRequirementFormModal
    v-model:open="formOpen"
    :editing="editing"
    @success="load"
  />
</template>
