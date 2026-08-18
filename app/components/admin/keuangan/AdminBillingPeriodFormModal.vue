<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import { useKeuanganStore } from '~/stores/keuangan'
import { useKeuanganPeriodContext } from '~/composables/useKeuanganPeriodContext'
import type { BillingPeriod, PeriodType } from '#shared/types/Keuangan'

const props = defineProps<{
  open: boolean
  period?: BillingPeriod | null
}>()

const emit = defineEmits<{
  'update:open': [boolean]
  success: []
}>()

const store = useKeuanganStore()
const toast = useToast()
const { selectedPeriodId, selectedPeriod, periodOptions, loadPeriods } = useKeuanganPeriodContext()

const isSubmitting = ref(false)

const isEdit = computed(() => !!props.period)

const periodTypeOptions = [
  { label: 'Bulanan', value: 'monthly' as PeriodType },
  { label: 'Mingguan', value: 'weekly' as PeriodType },
  { label: 'Semester', value: 'semesterly' as PeriodType },
  { label: 'Tahunan', value: 'yearly' as PeriodType },
  { label: 'Sekali', value: 'once' as PeriodType },
]

const schema = z.object({
  accounting_period_id: z.string().min(1, 'Periode akuntansi wajib dipilih'),
  name: z.string().min(1, 'Nama periode wajib diisi'),
  period_type: z.enum(['monthly', 'semesterly', 'yearly', 'once', 'weekly']),
  start_date: z.string().min(1, 'Tanggal mulai wajib diisi'),
  end_date: z.string().min(1, 'Tanggal selesai wajib diisi'),
}).superRefine((data, ctx) => {
  if (data.end_date <= data.start_date) {
    ctx.addIssue({ code: 'custom', message: 'Tanggal selesai harus setelah tanggal mulai', path: ['end_date'] })
    return
  }
  const ap = selectedPeriod.value
  if (ap) {
    if (data.start_date < ap.start_date || data.end_date > ap.end_date) {
      ctx.addIssue({
        code: 'custom',
        message: `Rentang tanggal harus berada dalam periode akuntansi (${ap.start_date} s/d ${ap.end_date})`,
        path: ['end_date'],
      })
    }
  }
})

const name = ref('')
const periodType = ref<PeriodType>('monthly')
const accountingPeriodId = ref('')
const startDate = ref('')
const endDate = ref('')

function reset() {
  if (props.period) {
    name.value = props.period.name
    periodType.value = props.period.period_type
    accountingPeriodId.value = props.period.accounting_period_id
    startDate.value = props.period.start_date
    endDate.value = props.period.end_date
  } else {
    name.value = ''
    periodType.value = 'monthly'
    accountingPeriodId.value = selectedPeriodId.value ?? ''
    startDate.value = ''
    endDate.value = ''
  }
}

watch(
  () => props.open,
  (v) => {
    if (v) {
      if (!isEdit.value) loadPeriods()
      reset()
    }
  },
)

async function onSubmit(_e: FormSubmitEvent<z.output<typeof schema>>) {
  isSubmitting.value = true
  try {
    if (isEdit.value && props.period) {
      await store.updateBillingPeriod(props.period.id, {
        name: name.value,
        period_type: periodType.value,
        start_date: startDate.value,
        end_date: endDate.value,
      })
      toast.add({ title: 'Periode tagihan berhasil diperbarui', color: 'success' })
    } else {
      await store.createBillingPeriod({
        name: name.value,
        period_type: periodType.value,
        accounting_period_id: accountingPeriodId.value,
        start_date: startDate.value,
        end_date: endDate.value,
      })
      toast.add({ title: 'Periode tagihan berhasil dibuat', color: 'success' })
    }
    emit('update:open', false)
    emit('success')
  } catch (err) {
    toast.add({ title: isEdit.value ? 'Gagal memperbarui periode tagihan' : 'Gagal membuat periode tagihan', description: store.error || undefined, color: 'error' })
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
          <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">{{ isEdit ? 'Edit Periode Tagihan' : 'Buat Periode Tagihan' }}</h3>
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

        <UForm
          :schema="schema"
          :state="{ accounting_period_id: accountingPeriodId, name, period_type: periodType, start_date: startDate, end_date: endDate }"
          class="space-y-4"
          @submit="onSubmit"
        >
          <UFormField label="Periode Akuntansi" name="accounting_period_id" required>
            <USelect
              v-model="accountingPeriodId"
              :items="periodOptions"
              placeholder="Pilih periode akuntansi..."
              :disabled="isEdit"
              class="w-full"
            />
            <p v-if="selectedPeriod" class="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Rentang periode: {{ selectedPeriod.start_date }} s/d {{ selectedPeriod.end_date }}
            </p>
          </UFormField>

          <UFormField label="Nama Periode" name="name" required>
            <UInput v-model="name" placeholder="cth: Januari 2026" variant="subtle" class="w-full" />
          </UFormField>

          <UFormField label="Tipe Periode" name="period_type" required>
            <USelect v-model="periodType" :items="periodTypeOptions" class="w-full" />
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
              {{ isEdit ? 'Simpan Perubahan' : 'Buat Periode' }}
            </UButton>
          </div>
        </UForm>
      </div>
    </template>
  </UModal>
</template>
