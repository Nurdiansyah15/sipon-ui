<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import { useKeuanganAccountingStore } from '~/stores/keuanganAccounting'

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  'update:open': [boolean]
  success: []
}>()

const store = useKeuanganAccountingStore()
const toast = useToast()

const isSubmitting = ref(false)

const schema = z.object({
  name: z.string().min(1, 'Nama periode wajib diisi'),
  start_date: z.string().min(1, 'Tanggal mulai wajib diisi'),
  end_date: z.string().min(1, 'Tanggal selesai wajib diisi'),
}).refine(data => data.end_date > data.start_date, {
  message: 'Tanggal selesai harus setelah tanggal mulai',
  path: ['end_date'],
})

const name = ref('')
const startDate = ref('')
const endDate = ref('')

function reset() {
  name.value = ''
  startDate.value = ''
  endDate.value = ''
}

watch(() => props.open, (v) => { if (v) reset() })

async function onSubmit(_e: FormSubmitEvent<z.output<typeof schema>>) {
  isSubmitting.value = true
  try {
    await store.createPeriod({
      name: name.value,
      start_date: startDate.value,
      end_date: endDate.value,
    })
    toast.add({ title: 'Periode berhasil dibuat', color: 'success' })
    emit('update:open', false)
    emit('success')
  } catch (err) {
    toast.add({ title: 'Gagal membuat periode', description: store.error || undefined, color: 'error' })
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <UModal :open="open" :dismissible="!isSubmitting" @update:open="v => !isSubmitting && emit('update:open', v)">
    <template #content>
      <div class="p-6">
        <div class="mb-5 flex items-center justify-between">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Buat Periode Akuntansi</h3>
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

        <UForm :schema="schema" :state="{ name, start_date: startDate, end_date: endDate }" class="space-y-4" @submit="onSubmit">
          <UFormField label="Nama Periode" name="name" required>
            <UInput v-model="name" placeholder="cth: Periode Januari 2026" variant="subtle" class="w-full" />
          </UFormField>

          <div class="grid grid-cols-2 gap-3">
            <UFormField label="Tanggal Mulai" name="start_date" required>
              <UInput v-model="startDate" type="date" variant="subtle" class="w-full" />
            </UFormField>
            <UFormField label="Tanggal Selesai" name="end_date" required>
              <UInput v-model="endDate" type="date" variant="subtle" class="w-full" />
            </UFormField>
          </div>

          <div class="flex justify-end gap-2 border-t border-gray-200 pt-4 dark:border-gray-700">
            <UButton color="neutral" variant="outline" :disabled="isSubmitting" @click="emit('update:open', false)">
              Batal
            </UButton>
            <UButton type="submit" :loading="isSubmitting" color="primary">
              Buat Periode
            </UButton>
          </div>
        </UForm>
      </div>
    </template>
  </UModal>
</template>
