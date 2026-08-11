<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import type { AcademicPeriod } from '#shared/types/Akademik'
import { useAkademikStore } from '~/stores/akademik'

const props = defineProps<{
  open: boolean
  period?: AcademicPeriod | null
}>()

const emit = defineEmits<{
  'update:open': [boolean]
  success: []
}>()

const store = useAkademikStore()
const toast = useToast()

const isEdit = computed(() => !!props.period)
const isSubmitting = computed(() => store.isSubmitting)

const schema = z.object({
  code: z.string().min(1, 'Kode wajib diisi'),
  name: z.string().min(1, 'Nama wajib diisi'),
  start_date: z.string().min(1, 'Tanggal mulai wajib diisi'),
  end_date: z.string().min(1, 'Tanggal selesai wajib diisi'),
}).refine(data => data.end_date > data.start_date, {
  message: 'Tanggal selesai harus setelah tanggal mulai',
  path: ['end_date'],
})

const form = reactive({
  code: '',
  name: '',
  start_date: '',
  end_date: '',
})

watch(() => props.open, (val) => {
  if (val) {
    if (props.period) {
      form.code = props.period.code
      form.name = props.period.name
      form.start_date = props.period.start_date
      form.end_date = props.period.end_date
    } else {
      form.code = ''
      form.name = ''
      form.start_date = ''
      form.end_date = ''
    }
  }
})

async function onSubmit(_e: FormSubmitEvent<z.output<typeof schema>>) {
  try {
    if (props.period) {
      await store.updatePeriod(props.period.id, {
        code: form.code,
        name: form.name,
        start_date: form.start_date,
        end_date: form.end_date,
      })
      toast.add({ title: 'Periode diperbarui', color: 'success' })
    } else {
      await store.createPeriod({
        code: form.code,
        name: form.name,
        start_date: form.start_date,
        end_date: form.end_date,
      })
      toast.add({ title: 'Periode berhasil dibuat', color: 'success' })
    }
    emit('update:open', false)
    emit('success')
  } catch {
    toast.add({ title: store.error ?? 'Gagal menyimpan periode', color: 'error' })
  }
}
</script>

<template>
  <UModal :open="open" :dismissible="!isSubmitting" @update:open="v => !isSubmitting && emit('update:open', v)">
    <template #content>
      <div class="p-6">
        <div class="mb-5 flex items-center justify-between">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {{ isEdit ? 'Edit Periode Akademik' : 'Buat Periode Akademik' }}
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
            <UInput v-model="form.code" placeholder="cth: 2026/2027-P1" variant="subtle" class="w-full" />
          </UFormField>

          <UFormField label="Nama" name="name" required>
            <UInput v-model="form.name" placeholder="cth: Periode 1 2026/2027" variant="subtle" class="w-full" />
          </UFormField>

          <div class="grid grid-cols-2 gap-3">
            <UFormField label="Tanggal Mulai" name="start_date" required>
              <UInput v-model="form.start_date" type="date" variant="subtle" class="w-full" />
            </UFormField>
            <UFormField label="Tanggal Selesai" name="end_date" required>
              <UInput v-model="form.end_date" type="date" variant="subtle" class="w-full" />
            </UFormField>
          </div>

          <div class="flex justify-end gap-2 border-t border-gray-200 pt-4 dark:border-gray-700">
            <UButton color="neutral" variant="outline" :disabled="isSubmitting" @click="emit('update:open', false)">
              Batal
            </UButton>
            <UButton type="submit" :loading="isSubmitting" color="primary">
              {{ isEdit ? 'Simpan' : 'Buat Periode' }}
            </UButton>
          </div>
        </UForm>
      </div>
    </template>
  </UModal>
</template>
