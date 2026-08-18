<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import type { FeeComponent, PeriodType } from '#shared/types/Keuangan'
import { useKeuanganStore } from '~/stores/keuangan'

const props = defineProps<{
  open: boolean
  component?: FeeComponent | null
}>()

const emit = defineEmits<{
  'update:open': [boolean]
  success: []
}>()

const store = useKeuanganStore()
const toast = useToast()

const isEdit = computed(() => !!props.component)

const periodOptions = [
  { label: 'Bulanan', value: 'monthly' as PeriodType },
  { label: 'Mingguan', value: 'weekly' as PeriodType },
  { label: 'Semester', value: 'semesterly' as PeriodType },
  { label: 'Tahunan', value: 'yearly' as PeriodType },
  { label: 'Sekali', value: 'once' as PeriodType },
]

const schema = z.object({
  code: z.string().min(1, 'Kode wajib diisi'),
  name: z.string().min(1, 'Nama wajib diisi'),
  revenue_account_id: z.string().min(1, 'Akun pendapatan wajib dipilih'),
  receivable_account_id: z.string().min(1, 'Akun piutang wajib dipilih'),
  amount: z.number().positive('Jumlah harus lebih dari 0'),
  is_periodic: z.boolean(),
  period_type: z.enum(['monthly', 'semesterly', 'yearly', 'once', 'weekly']),
  description: z.string().optional(),
})

const form = reactive({
  code: '',
  name: '',
  revenue_account_id: '',
  receivable_account_id: '',
  amount: 0,
  is_periodic: false,
  period_type: 'monthly' as PeriodType,
  description: '',
})

watch(() => props.open, (val) => {
  if (val) {
    if (props.component) {
      form.code = props.component.code
      form.name = props.component.name
      form.revenue_account_id = props.component.revenue_account_id
      form.receivable_account_id = props.component.receivable_account_id
      form.amount = props.component.amount
      form.is_periodic = props.component.is_periodic
      form.period_type = props.component.period_type ?? 'monthly'
      form.description = props.component.description ?? ''
    } else {
      form.code = ''
      form.name = ''
      form.revenue_account_id = ''
      form.receivable_account_id = ''
      form.amount = 0
      form.is_periodic = false
      form.period_type = 'monthly'
      form.description = ''
    }
  }
})

const saving = ref(false)

async function onSubmit(_e: FormSubmitEvent<z.output<typeof schema>>) {
  saving.value = true
  try {
    if (isEdit.value && props.component) {
      await store.updateFeeComponent(props.component.id, {
        revenue_account_id: form.revenue_account_id,
        receivable_account_id: form.receivable_account_id,
        name: form.name,
        amount: form.amount,
        is_periodic: form.is_periodic,
        period_type: form.is_periodic ? form.period_type : null,
        description: form.description || undefined,
      })
      toast.add({ title: 'Komponen biaya diperbarui', color: 'success' })
    } else {
      await store.createFeeComponent({
        code: form.code,
        name: form.name,
        revenue_account_id: form.revenue_account_id,
        receivable_account_id: form.receivable_account_id,
        amount: form.amount,
        is_periodic: form.is_periodic,
        period_type: form.is_periodic ? form.period_type : undefined,
        description: form.description || undefined,
      })
      toast.add({ title: 'Komponen biaya dibuat', color: 'success' })
    }
    emit('update:open', false)
    emit('success')
  } catch {
    toast.add({ title: store.error ?? 'Gagal menyimpan komponen biaya', color: 'error' })
  } finally {
    saving.value = false
  }
}

function close() {
  if (saving.value) return
  emit('update:open', false)
}
</script>

<template>
  <UModal :open="open" :dismissible="!saving" @update:open="(v: boolean) => emit('update:open', v)">
    <template #content>
      <div class="p-6">
        <div class="mb-5 flex items-center justify-between">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {{ isEdit ? 'Edit Komponen Biaya' : 'Tambah Komponen Biaya' }}
          </h3>
          <UButton
            v-if="!saving"
            color="neutral"
            variant="ghost"
            icon="i-lucide-x"
            size="sm"
            square
            @click="close"
          />
        </div>

        <UForm :schema="schema" :state="form" class="space-y-4" @submit="onSubmit">
          <div class="grid grid-cols-2 gap-3">
            <UFormField label="Kode" name="code" required>
              <UInput v-model="form.code" placeholder="Contoh: UKT-001" :disabled="isEdit" variant="subtle" class="w-full" />
            </UFormField>
            <UFormField label="Nama" name="name" required>
              <UInput v-model="form.name" placeholder="Nama komponen biaya" variant="subtle" class="w-full" />
            </UFormField>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <UFormField label="Jumlah (Rp)" name="amount" required>
              <UInput v-model.number="form.amount" type="number" placeholder="0" :min="0" variant="subtle" class="w-full" />
            </UFormField>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <UFormField label="Akun Pendapatan" name="revenue_account_id" required>
              <KeuanganAccountPicker
                v-model="form.revenue_account_id"
                filter="revenue"
                placeholder="Pilih akun pendapatan..."
              />
            </UFormField>
            <UFormField label="Akun Piutang" name="receivable_account_id" required>
              <KeuanganAccountPicker
                v-model="form.receivable_account_id"
                sub-type="receivable"
                placeholder="Pilih akun piutang..."
              />
            </UFormField>
          </div>

          <UFormField label="Berkala">
            <USwitch v-model="form.is_periodic" class="mb-1" />
          </UFormField>
          <UFormField v-if="form.is_periodic" label="Periode" name="period_type">
            <USelect v-model="form.period_type" :items="periodOptions" variant="subtle" class="w-full" />
          </UFormField>
          <UFormField label="Deskripsi" name="description">
            <UTextarea v-model="form.description" placeholder="Deskripsi (opsional)" :rows="2" variant="subtle" class="w-full" />
          </UFormField>

          <div class="flex justify-end gap-2 border-t border-gray-200 pt-4 dark:border-gray-700">
            <UButton color="neutral" variant="outline" :disabled="saving" @click="close">
              Batal
            </UButton>
            <UButton type="submit" :loading="saving" color="primary">
              Simpan
            </UButton>
          </div>
        </UForm>
      </div>
    </template>
  </UModal>
</template>
