<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import { useAkademikSantriStore } from '~/stores/akademik-santri'
import { useAkademikStore } from '~/stores/akademik'
import type { Program } from '#shared/types/Akademik'

const props = defineProps<{
  open: boolean
  currentProgramId: string
}>()

const emit = defineEmits<{
  'update:open': [boolean]
  success: []
}>()

const santriStore = useAkademikSantriStore()
const akademikStore = useAkademikStore()
const toast = useToast()

const isSubmitting = computed(() => santriStore.isSubmitting)
const loading = ref(false)
const programs = ref<Program[]>([])

const schema = z.object({
  to_program_id: z.string().min(1, 'Program tujuan wajib dipilih'),
  notes: z.string().optional(),
})
const form = reactive({ to_program_id: '', notes: '' })

watch(() => props.open, async (val) => {
  if (!val) return
  form.to_program_id = ''
  form.notes = ''
  await loadPrograms()
})

async function loadPrograms() {
  loading.value = true
  try {
    await akademikStore.fetchPrograms({ status: 'active', page: 1, limit: 100 })
    programs.value = akademikStore.programs.filter((p) => p.status === 'active' && p.id !== props.currentProgramId)
  } catch {
    toast.add({ title: 'Gagal memuat daftar program', color: 'error' })
  } finally {
    loading.value = false
  }
}

async function onSubmit(_e: FormSubmitEvent<z.output<typeof schema>>) {
  try {
    await santriStore.requestProgramTransfer(form.to_program_id, form.notes || undefined)
    toast.add({ title: 'Permintaan pindah program diajukan', color: 'success' })
    emit('update:open', false)
    emit('success')
  } catch {
    toast.add({ title: santriStore.error ?? 'Gagal mengajukan permintaan', color: 'error' })
  }
}
</script>

<template>
  <UModal :open="open" :dismissible="!isSubmitting" @update:open="v => !isSubmitting && emit('update:open', v)">
    <template #content>
      <div class="p-6">
        <div class="mb-5 flex items-center justify-between">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Ajukan Pindah Program
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

        <p class="mb-4 text-sm text-gray-700 dark:text-gray-300">
          Ajukan permintaan pindah ke program lain. Permintaan akan ditinjau oleh admin sebelum disetujui.
        </p>

        <UForm :schema="schema" :state="form" class="space-y-4" @submit="onSubmit">
          <UFormField label="Program Tujuan" name="to_program_id" required>
            <USelect
              v-model="form.to_program_id"
              :items="programs.map(p => ({ label: `${p.code} — ${p.name}`, value: p.id }))"
              :loading="loading"
              placeholder="Pilih program…"
              variant="subtle"
              class="w-full"
            />
          </UFormField>

          <UFormField label="Catatan" name="notes" :hint="form.notes.length > 0 ? `${form.notes.length} karakter` : undefined">
            <UTextarea v-model="form.notes" placeholder="Alasan pindah (opsional)" :rows="3" class="w-full" />
          </UFormField>

          <div class="flex justify-end gap-2 border-t border-gray-200 pt-4 dark:border-gray-700">
            <UButton color="neutral" variant="outline" :disabled="isSubmitting" @click="emit('update:open', false)">
              Batal
            </UButton>
            <UButton type="submit" :loading="isSubmitting" color="primary">
              Ajukan
            </UButton>
          </div>
        </UForm>
      </div>
    </template>
  </UModal>
</template>
