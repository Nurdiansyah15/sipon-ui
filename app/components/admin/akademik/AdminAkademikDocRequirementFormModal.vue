<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import { useAkademikStore } from '~/stores/akademik'
import { parseApiError } from '~/utils/errorParser'
import { useAkademikPeriodContext } from '~/composables/useAkademikPeriodContext'
import type { HerregistrasiDocumentRequirement } from '#shared/types/AkademikSantri'

const props = defineProps<{
  open: boolean
  editing: HerregistrasiDocumentRequirement | null
}>()

const emit = defineEmits<{
  'update:open': [boolean]
  success: []
}>()

const store = useAkademikStore()
const { selectedPeriodId } = useAkademikPeriodContext()
const toast = useToast()

const schema = z.object({
  kind: z.string().min(1, 'Kode dokumen wajib diisi'),
  label: z.string().min(1, 'Nama dokumen wajib diisi'),
  is_required: z.boolean(),
  description: z.string().optional(),
})

const form = reactive({
  kind: '',
  label: '',
  is_required: true,
  description: '',
})

watch(() => props.open, (val) => {
  if (!val) return
  if (props.editing) {
    form.kind = props.editing.kind
    form.label = props.editing.label
    form.is_required = props.editing.is_required
    form.description = props.editing.description ?? ''
  } else {
    form.kind = ''
    form.label = ''
    form.is_required = true
    form.description = ''
  }
})

async function onSubmit(_e: FormSubmitEvent<z.output<typeof schema>>) {
  if (!selectedPeriodId.value) return
  try {
    if (props.editing) {
      await store.updateDocRequirement(props.editing.id, {
        label: form.label,
        is_required: form.is_required,
        description: form.description || undefined,
      })
      toast.add({ title: 'Dokumen diperbarui', color: 'success' })
    } else {
      await store.createDocRequirement(selectedPeriodId.value, {
        kind: form.kind,
        label: form.label,
        is_required: form.is_required,
        description: form.description || undefined,
      })
      toast.add({ title: 'Dokumen ditambahkan', color: 'success' })
    }
    emit('update:open', false)
    emit('success')
  } catch (err) {
    toast.add({ title: 'Gagal menyimpan', description: parseApiError(err), color: 'error' })
  }
}
</script>

<template>
  <UModal :open="open" :dismissible="!store.isSubmitting" @update:open="v => !store.isSubmitting && emit('update:open', v)">
    <template #content>
      <div class="p-6">
        <h3 class="mb-5 text-lg font-semibold text-gray-900 dark:text-gray-100">
          {{ editing ? 'Edit Dokumen' : 'Tambah Dokumen' }}
        </h3>

        <UForm :schema="schema" :state="form" class="space-y-4" @submit="onSubmit">
          <UFormField label="Kode Dokumen" name="kind" required>
            <UInput
              v-model="form.kind"
              :disabled="!!editing"
              placeholder="mis. surat_pernyataan"
              variant="subtle"
              class="w-full"
            />
          </UFormField>

          <UFormField label="Nama Dokumen" name="label" required>
            <UInput v-model="form.label" placeholder="mis. Surat Pernyataan" variant="subtle" class="w-full" />
          </UFormField>

          <UFormField label="Keterangan" name="description">
            <UInput v-model="form.description" placeholder="opsional" variant="subtle" class="w-full" />
          </UFormField>

          <div class="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3 dark:border-gray-700/50">
            <div>
              <p class="text-sm font-medium text-gray-900 dark:text-gray-100">Wajib di-upload</p>
              <p class="text-xs text-gray-500 dark:text-gray-400">Santri wajib mengunggah dokumen ini.</p>
            </div>
            <USwitch v-model="form.is_required" />
          </div>

          <div class="flex justify-end gap-2 border-t border-gray-200 pt-4 dark:border-gray-700">
            <UButton color="neutral" variant="outline" :disabled="store.isSubmitting" @click="emit('update:open', false)">
              Batal
            </UButton>
            <UButton type="submit" :loading="store.isSubmitting" color="primary">
              {{ editing ? 'Simpan' : 'Tambah' }}
            </UButton>
          </div>
        </UForm>
      </div>
    </template>
  </UModal>
</template>
