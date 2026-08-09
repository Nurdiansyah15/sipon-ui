<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import { useKeuanganStore } from '~/stores/keuangan'
import { useKesantrianStore } from '~/stores/kesantrian'

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  'update:open': [boolean]
  success: []
}>()

const store = useKeuanganStore()
const santriStore = useKesantrianStore()
const toast = useToast()

const santriOptions = computed(() =>
  santriStore.santriList.map((s) => ({
    label: s.fullname ? `${s.fullname}${s.nis ? ` (${s.nis})` : ''}` : s.nis ?? s.username,
    value: s.id,
  })),
)

const schema = z.object({
  santri_id: z.string().min(1, 'Santri wajib dipilih'),
  fee_component_id: z.string().min(1, 'Komponen biaya wajib dipilih'),
  billing_period_id: z.string().optional(),
  issued_date: z.string().min(1, 'Tanggal terbit wajib diisi'),
  amount: z.number().min(1, 'Jumlah wajib diisi'),
  due_date: z.string().min(1, 'Tanggal jatuh tempo wajib diisi'),
  notes: z.string().optional(),
})
type Schema = z.output<typeof schema>

const state = reactive<Partial<Schema>>({
  santri_id: '',
  fee_component_id: '',
  billing_period_id: '',
  issued_date: '',
  amount: undefined,
  due_date: '',
  notes: '',
})

const componentOptions = computed(() =>
  store.feeComponents.map((c) => ({
    label: `${c.code} - ${c.name}${c.is_periodic ? '' : ' (non-periodik)'}`,
    value: c.id,
  })),
)

const selectedComponent = computed(() =>
  store.feeComponents.find((c) => c.id === state.fee_component_id),
)

const isPeriodicComponent = computed(() => selectedComponent.value?.is_periodic ?? false)

const billingPeriodOptions = computed(() =>
  store.billingPeriods.map((p) => ({
    label: p.name,
    value: p.id,
  })),
)

function resetState() {
  state.santri_id = ''
  state.fee_component_id = ''
  state.billing_period_id = ''
  state.issued_date = new Date().toISOString().slice(0, 10)
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
        await Promise.all([
          store.fetchFeeComponents({ is_active: true, limit: 100 }),
          store.fetchBillingPeriods({ status: 'open', limit: 100 }),
          santriStore.fetchSantriList({ limit: 100 }),
        ])
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
      billing_period_id: event.data.billing_period_id || undefined,
      issued_date: event.data.issued_date,
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
            <USelectMenu
              v-model="state.santri_id"
              :items="santriOptions"
              value-key="value"
              placeholder="Cari nama atau NIS santri..."
              searchable
              class="w-full"
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

          <UFormField label="Periode Tagihan" name="billing_period_id" :required="isPeriodicComponent">
            <USelect
              v-model="state.billing_period_id"
              :items="billingPeriodOptions"
              :placeholder="isPeriodicComponent ? 'Pilih periode tagihan' : 'Opsional (komponen non-periodik)'"
              class="w-full"
              :ui="{ base: 'bg-gray-50 dark:bg-gray-800', value: 'text-gray-900 dark:text-gray-100' }"
            />
            <p v-if="isPeriodicComponent && !state.billing_period_id" class="mt-1 text-xs text-amber-600 dark:text-amber-400">
              Komponen ini periodik — periode tagihan wajib diisi.
            </p>
            <p v-else-if="!isPeriodicComponent" class="mt-1 text-xs text-gray-400">
              Komponen non-periodik — periode tagihan boleh dikosongkan.
            </p>
          </UFormField>

          <UFormField label="Tanggal Terbit" name="issued_date" required>
            <UInput
              v-model="state.issued_date"
              type="date"
              class="w-full"
              variant="subtle"
            />
          </UFormField>

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
