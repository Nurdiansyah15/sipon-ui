<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import { useAkademikStore } from '~/stores/akademik'
import type { Program } from '#shared/types/Akademik'

const props = defineProps<{
  open: boolean
  santriId: string
  santriName?: string
}>()

const emit = defineEmits<{
  'update:open': [boolean]
  success: []
}>()

const store = useAkademikStore()
const toast = useToast()

const isSubmitting = computed(() => store.isSubmitting)
const loadingPrograms = ref(false)
const programs = ref<Program[]>([])
const currentProgram = ref<{ id: string; code: string; name: string } | null>(null)

const schema = z.object({
  program_id: z.string().min(1, 'Program wajib dipilih'),
})
const form = reactive({ program_id: '' })

watch(() => props.open, async (val) => {
  if (!val) return
  form.program_id = ''
  currentProgram.value = null
  await loadData()
})

async function loadData() {
  loadingPrograms.value = true
  try {
    await store.fetchPrograms({ status: 'active', page: 1, limit: 100 })
    programs.value = store.programs.filter((p) => p.status === 'active')
  } catch {
    toast.add({ title: 'Gagal memuat daftar program', color: 'error' })
  }
  try {
    const res = await store.fetchSantriProgram(props.santriId)
    currentProgram.value = res.program
  } catch {
    // belum punya program aktif — ok
  } finally {
    loadingPrograms.value = false
  }
}

async function onSubmit(_e: FormSubmitEvent<z.output<typeof schema>>) {
  try {
    await store.assignSantriProgram(props.santriId, form.program_id)
    toast.add({ title: 'Program santri berhasil diubah', color: 'success' })
    emit('update:open', false)
    emit('success')
  } catch {
    toast.add({ title: store.error ?? 'Gagal mengubah program santri', color: 'error' })
  }
}
</script>

<template>
  <UModal :open="open" :dismissible="!isSubmitting" @update:open="v => !isSubmitting && emit('update:open', v)">
    <template #content>
      <div class="p-6">
        <div class="mb-5 flex items-center justify-between">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Ubah Program Santri
          </h3>
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

        <div class="mb-4 space-y-2 text-sm">
          <p class="text-gray-700 dark:text-gray-300">
            Santri: <span class="font-medium text-gray-900 dark:text-gray-100">{{ santriName || santriId }}</span>
          </p>
          <p class="text-gray-700 dark:text-gray-300">
            Program saat ini:
            <span v-if="currentProgram" class="font-medium text-gray-900 dark:text-gray-100">
              {{ currentProgram.code }} — {{ currentProgram.name }}
            </span>
            <span v-else class="italic text-gray-500 dark:text-gray-400">Belum ada program aktif</span>
          </p>
        </div>

        <UForm :schema="schema" :state="form" class="space-y-4" @submit="onSubmit">
          <UFormField label="Program Baru" name="program_id" required>
            <USelect
              v-model="form.program_id"
              :items="programs.map(p => ({ label: `${p.code} — ${p.name}`, value: p.id }))"
              :loading="loadingPrograms"
              placeholder="Pilih program…"
              variant="subtle"
              class="w-full"
            />
          </UFormField>

          <div class="flex justify-end gap-2 border-t border-gray-200 pt-4 dark:border-gray-700">
            <UButton color="neutral" variant="outline" :disabled="isSubmitting" @click="emit('update:open', false)">
              Batal
            </UButton>
            <UButton type="submit" :loading="isSubmitting" color="primary">
              Simpan
            </UButton>
          </div>
        </UForm>
      </div>
    </template>
  </UModal>
</template>
