<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import { useKeuanganStore } from '~/stores/keuangan'

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  'update:open': [boolean]
  success: []
}>()

const store = useKeuanganStore()
const toast = useToast()

const schema = z.object({
  santri_id: z.string().min(1, 'Santri wajib dipilih'),
  fee_component_id: z.string().min(1, 'Komponen biaya wajib dipilih'),
  periode: z.string().min(1, 'Periode wajib diisi'),
  tahun_ajaran: z.string().min(1, 'Tahun ajaran wajib diisi'),
  amount: z.number().min(1, 'Jumlah wajib diisi'),
  due_date: z.string().min(1, 'Tanggal jatuh tempo wajib diisi'),
  notes: z.string().optional(),
})
type Schema = z.output<typeof schema>

const state = reactive<Partial<Schema>>({
  santri_id: '',
  fee_component_id: '',
  periode: '',
  tahun_ajaran: '',
  amount: undefined,
  due_date: '',
  notes: '',
})

const componentOptions = computed(() =>
  store.feeComponents.map((c) => ({
    label: `${c.code} - ${c.name}`,
    value: c.id,
  })),
)

function resetState() {
  state.santri_id = ''
  state.fee_component_id = ''
  state.periode = ''
  state.tahun_ajaran = ''
  state.amount = undefined
  state.due_date = ''
  state.notes = ''
}

function close() {
  resetState()
  emit('update:open', false)
}

watch(
  () => props.open,
  async (open) => {
    if (open) {
      resetState()
      try {
        await store.fetchFeeComponents({ is_active: true, limit: 100 })
      } catch {
        /* error in store */
      }
    }
  },
)

async function onSubmit(event: FormSubmitEvent<Schema>) {
  try {
    await store.createInvoice({
      santri_id: event.data.santri_id,
      fee_component_id: event.data.fee_component_id,
      periode: event.data.periode,
      tahun_ajaran: event.data.tahun_ajaran,
      amount: event.data.amount,
      due_date: event.data.due_date,
      notes: event.data.notes || undefined,
    })
    toast.add({ title: 'Tagihan berhasil dibuat', color: 'success' })
    emit('success')
    close()
  } catch {
    toast.add({
      title: 'Gagal membuat tagihan',
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
          <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Buat Tagihan</h3>
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
          <UFormField label="Santri" name="santri_id" required>
            <UInput
              v-model="state.santri_id"
              class="w-full"
              variant="subtle"
              placeholder="ID Santri"
            />
          </UFormField>

          <UFormField label="Komponen Biaya" name="fee_component_id" required>
            <USelect
              v-model="state.fee_component_id"
              :items="componentOptions"
              placeholder="Pilih komponen"
              class="w-full"
              :ui="{ base: 'bg-gray-50 dark:bg-gray-800', value: 'text-gray-900 dark:text-gray-100' }"
            />
          </UFormField>

          <div class="grid grid-cols-2 gap-4">
            <UFormField label="Periode" name="periode" required>
              <UInput v-model="state.periode" class="w-full" variant="subtle" placeholder="Semester 1" />
            </UFormField>
            <UFormField label="Tahun Ajaran" name="tahun_ajaran" required>
              <UInput v-model="state.tahun_ajaran" class="w-full" variant="subtle" placeholder="2025/2026" />
            </UFormField>
          </div>

          <UFormField label="Jumlah (Rp)" name="amount" required>
            <UInput
              v-model="state.amount"
              type="number"
              class="w-full"
              variant="subtle"
              placeholder="0"
            />
          </UFormField>

          <UFormField label="Jatuh Tempo" name="due_date" required>
            <UInput
              v-model="state.due_date"
              type="date"
              class="w-full"
              variant="subtle"
            />
          </UFormField>

          <UFormField label="Catatan" name="notes">
            <UTextarea v-model="state.notes" class="w-full" variant="subtle" placeholder="Opsional" :rows="2" />
          </UFormField>

          <div class="flex justify-end gap-2 pt-2">
            <UButton color="neutral" variant="ghost" type="button" @click="close">Batal</UButton>
            <UButton
              type="submit"
              :loading="store.isSubmitting"
              icon="i-lucide-plus"
              class="bg-teal-600 text-white hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-400"
            >
              Buat Tagihan
            </UButton>
          </div>
        </UForm>
      </div>
    </template>
  </UModal>
</template>
