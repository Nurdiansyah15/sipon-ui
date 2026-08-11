<script setup lang="ts">
import { useAkademikStore } from '~/stores/akademik'
import { parseApiError } from '~/utils/errorParser'
import type { Program } from '#shared/types/Akademik'

definePageMeta({ layout: 'akademik' })

const store = useAkademikStore()
const toast = useToast()

const programId = ref<string | undefined>(undefined)
const selectedProgram = ref<Program | null>(null)
const programs = ref<Program[]>([])
const isLoaded = ref(false)

onMounted(async () => {
  try {
    const [settings, programRes] = await Promise.all([
      store.fetchAkademikSettings(),
      store.fetchPrograms({ status: 'active', limit: 100 }),
    ])
    programs.value = store.programs
    programId.value = settings.default_program_id ?? undefined
    selectedProgram.value = settings.default_program ?? null
  } catch (err) {
    toast.add({ title: 'Gagal memuat pengaturan', description: parseApiError(err), color: 'error' })
  } finally {
    isLoaded.value = true
  }
})

function onProgramChange(id: string | undefined) {
  programId.value = id
  selectedProgram.value = programs.value.find((p) => p.id === id) ?? null
}

async function onSave() {
  try {
    const res = await store.updateAkademikSettings({
      default_program_id: programId.value ?? null,
    })
    programId.value = res.default_program_id ?? undefined
    selectedProgram.value = res.default_program ?? null
    toast.add({ title: 'Pengaturan akademik berhasil disimpan', color: 'success' })
  } catch (err) {
    toast.add({ title: 'Gagal menyimpan pengaturan', description: parseApiError(err), color: 'error' })
  }
}
</script>

<template>
  <div class="mx-auto max-w-3xl px-4 py-8">
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Pengaturan Akademik</h1>
      <p class="mt-1 text-sm text-gray-500">Konfigurasi default untuk sistem akademik.</p>
    </div>

    <div v-if="!isLoaded" class="space-y-4">
      <USkeleton class="h-40 w-full" />
    </div>

    <div v-else class="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700/50 dark:bg-gray-900">
      <div class="mb-6 flex items-start gap-3">
        <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-50 dark:bg-teal-950">
          <UIcon name="i-lucide-graduation-cap" class="h-5 w-5 text-teal-600 dark:text-teal-400" />
        </div>
        <div>
          <h2 class="font-semibold text-gray-900 dark:text-gray-100">Program Default Santri</h2>
          <p class="mt-1 text-sm text-gray-500">
            Program yang otomatis dipakai saat admin membuat santri manual atau saat permintaan santri disetujui.
          </p>
        </div>
      </div>

      <div class="space-y-4">
        <UFormField
          label="Program Default"
          hint="Pilih program yang aktif dari daftar program"
          name="default_program_id"
        >
          <USelect
            v-model="programId"
            :items="programs.map((p) => ({ label: `${p.code} — ${p.name}`, value: p.id }))"
            placeholder="Pilih program default"
            class="w-full"
            variant="subtle"
            @update:model-value="onProgramChange"
          />
        </UFormField>

        <div v-if="selectedProgram" class="rounded-lg bg-gray-50 p-3 text-sm dark:bg-gray-800">
          <p class="text-gray-500">Program terpilih</p>
          <p class="mt-1 font-medium text-gray-900 dark:text-gray-100">
            <span class="font-mono text-teal-600 dark:text-teal-400">{{ selectedProgram.code }}</span>
            &nbsp;·&nbsp;{{ selectedProgram.name }}
          </p>
        </div>

        <div class="border-t border-gray-200 pt-4 dark:border-gray-700">
          <UButton
            icon="i-lucide-save"
            class="bg-teal-600 text-white hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-400"
            :loading="store.isSubmitting"
            @click="onSave"
          >
            Simpan Pengaturan
          </UButton>
        </div>
      </div>
    </div>
  </div>
</template>
