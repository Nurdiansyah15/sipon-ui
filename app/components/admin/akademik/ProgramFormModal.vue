<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import type { Program, ProgramStatus } from '#shared/types/Akademik'
import { useAkademikStore } from '~/stores/akademik'

const props = defineProps<{
  open: boolean
  program?: Program | null
}>()

const emit = defineEmits<{
  'update:open': [boolean]
  success: []
}>()

const store = useAkademikStore()
const toast = useToast()

const isEdit = computed(() => !!props.program)
const isSubmitting = computed(() => store.isSubmitting)

const schema = z.object({
  code: z.string().min(1, 'Kode wajib diisi'),
  name: z.string().min(1, 'Nama wajib diisi'),
  status: z.enum(['active', 'inactive'] as const),
})

const form = reactive({
  code: '',
  name: '',
  status: 'active' as ProgramStatus,
})

watch(() => props.open, (val) => {
  if (val) {
    if (props.program) {
      form.code = props.program.code
      form.name = props.program.name
      form.status = props.program.status
    } else {
      form.code = ''
      form.name = ''
      form.status = 'active'
    }
  }
})

async function onSubmit(_e: FormSubmitEvent<z.output<typeof schema>>) {
  try {
    if (props.program) {
      await store.updateProgram(props.program.id, {
        code: form.code,
        name: form.name,
        status: form.status,
      })
      toast.add({ title: 'Program diperbarui', color: 'success' })
    } else {
      await store.createProgram({ code: form.code, name: form.name })
      toast.add({ title: 'Program berhasil dibuat', color: 'success' })
    }
    emit('update:open', false)
    emit('success')
  } catch {
    toast.add({ title: store.error ?? 'Gagal menyimpan program', color: 'error' })
  }
}
</script>

<template>
  <UModal :open="open" :dismissible="!isSubmitting" @update:open="v => !isSubmitting && emit('update:open', v)">
    <template #content>
      <div class="p-6">
        <div class="mb-5 flex items-center justify-between">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {{ isEdit ? 'Edit Program' : 'Buat Program' }}
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

        <UForm :schema="schema" :state="form" class="space-y-4" @submit="onSubmit">
          <UFormField label="Kode" name="code" required>
            <UInput v-model="form.code" placeholder="cth: TAHFIDZ" variant="subtle" class="w-full" />
          </UFormField>

          <UFormField label="Nama" name="name" required>
            <UInput v-model="form.name" placeholder="cth: Tahfidz" variant="subtle" class="w-full" />
          </UFormField>

          <UFormField v-if="isEdit" label="Status" name="status" required>
            <USelect
              v-model="form.status"
              :items="[
                { label: 'Aktif', value: 'active' },
                { label: 'Nonaktif', value: 'inactive' },
              ]"
              class="w-full"
            />
          </UFormField>

          <div class="flex justify-end gap-2 border-t border-gray-200 pt-4 dark:border-gray-700">
            <UButton color="neutral" variant="outline" :disabled="isSubmitting" @click="emit('update:open', false)">
              Batal
            </UButton>
            <UButton type="submit" :loading="isSubmitting" color="primary">
              {{ isEdit ? 'Simpan' : 'Buat Program' }}
            </UButton>
          </div>
        </UForm>
      </div>
    </template>
  </UModal>
</template>
