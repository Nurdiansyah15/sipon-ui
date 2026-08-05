<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import type { AdjustmentType } from '#shared/types/Keuangan'

const props = defineProps<{
  open: boolean
  invoiceId: string
}>()

const emit = defineEmits<{
  'update:open': [boolean]
  success: []
}>()

const store = useKeuanganStore()
const toast = useToast()

const schema = z.object({
  type: z.enum(['beasiswa', 'diskon', 'penyesuaian'] as const),
  mode: z.enum(['amount', 'percentage'] as const),
  amount: z.number().optional(),
  percentage: z.number().optional(),
  description: z.string().optional(),
}).superRefine((val, ctx) => {
  if (val.mode === 'amount' && (!val.amount || val.amount <= 0)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Jumlah wajib diisi', path: ['amount'] })
  }
  if (val.mode === 'percentage' && (!val.percentage || val.percentage <= 0 || val.percentage > 100)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Persentase harus 1-100', path: ['percentage'] })
  }
})
type Schema = z.output<typeof schema>

const state = reactive<Partial<Schema>>({
  type: 'beasiswa' as AdjustmentType,
  mode: 'amount',
  amount: undefined,
  percentage: undefined,
  description: '',
})

const typeOptions = [
  { label: 'Beasiswa', value: 'beasiswa' },
  { label: 'Diskon', value: 'diskon' },
  { label: 'Penyesuaian', value: 'penyesuaian' },
]

function resetState() {
  state.type = 'beasiswa'
  state.mode = 'amount'
  state.amount = undefined
  state.percentage = undefined
  state.description = ''
}

function close() {
  resetState()
  emit('update:open', false)
}

watch(
  () => props.open,
  (open) => {
    if (open) resetState()
  },
)

async function onSubmit(event: FormSubmitEvent<Schema>) {
  try {
    const payload: { type: AdjustmentType; amount?: number; percentage?: number; description?: string } = {
      type: event.data.type,
      description: event.data.description || undefined,
    }
    if (event.data.mode === 'amount') {
      payload.amount = event.data.amount
    } else {
      payload.percentage = event.data.percentage
    }
    await store.applyAdjustment(props.invoiceId, payload)
    toast.add({ title: 'Penyesuaian berhasil diterapkan', color: 'success' })
    emit('success')
    close()
  } catch {
    toast.add({
      title: 'Gagal menerapkan penyesuaian',
      description: store.error ?? undefined,
      color: 'error',
    })
  }
}
</script>

<template>
  <UModal
    :open="open"
    @update:open="(v: boolean) => emit('update:open', v)"
  >
    <template #content>
      <div class="p-6">
        <div class="mb-4 flex items-center justify-between">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Terapkan Penyesuaian</h3>
          <UButton
            color="neutral"
            variant="ghost"
            icon="i-lucide-x"
            size="sm"
            square
            @click="close"
          />
        </div>

        <UForm
          :schema="schema"
          :state="state"
          class="space-y-4"
          @submit="onSubmit"
        >
          <UFormField label="Jenis Penyesuaian" name="type" required>
            <USelect
              v-model="state.type"
              :items="typeOptions"
              class="w-full"
              :ui="{ base: 'bg-gray-50 dark:bg-gray-800', value: 'text-gray-900 dark:text-gray-100' }"
            />
          </UFormField>

          <UFormField label="Metode Hitung">
            <div class="flex gap-4">
              <label class="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <input v-model="state.mode" type="radio" value="amount" class="accent-teal-600" />
                Nominal (Rp)
              </label>
              <label class="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <input v-model="state.mode" type="radio" value="percentage" class="accent-teal-600" />
                Persentase (%)
              </label>
            </div>
          </UFormField>

          <UFormField
            v-if="state.mode === 'amount'"
            label="Jumlah (Rp)"
            name="amount"
            required
          >
            <UInput
              v-model="state.amount"
              type="number"
              class="w-full"
              variant="subtle"
              placeholder="0"
            />
          </UFormField>

          <UFormField
            v-else
            label="Persentase (%)"
            name="percentage"
            required
          >
            <UInput
              v-model="state.percentage"
              type="number"
              class="w-full"
              variant="subtle"
              placeholder="0"
              :min="1"
              :max="100"
            />
          </UFormField>

          <UFormField label="Keterangan" name="description">
            <UTextarea v-model="state.description" class="w-full" variant="subtle" placeholder="Opsional" :rows="2" />
          </UFormField>

          <div class="flex justify-end gap-2 pt-2">
            <UButton color="neutral" variant="ghost" type="button" @click="close">Batal</UButton>
            <UButton
              type="submit"
              :loading="store.isSubmitting"
              class="bg-teal-600 text-white hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-400"
            >
              Terapkan
            </UButton>
          </div>
        </UForm>
      </div>
    </template>
  </UModal>
</template>
