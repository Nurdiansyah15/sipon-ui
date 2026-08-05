<script setup lang="ts">
import type { FeeComponent, FeeComponentType, PeriodType } from '#shared/types/Keuangan'
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

const typeOptions = [
  { label: 'UKT', value: 'ukt' as FeeComponentType },
  { label: 'SPP', value: 'spp' as FeeComponentType },
  { label: 'Daftar Ulang', value: 'daftar_ulang' as FeeComponentType },
  { label: 'Insidental', value: 'insidental' as FeeComponentType },
]

const periodOptions = [
  { label: 'Bulanan', value: 'monthly' as PeriodType },
  { label: 'Semester', value: 'semesterly' as PeriodType },
  { label: 'Tahunan', value: 'yearly' as PeriodType },
  { label: 'Sekali', value: 'once' as PeriodType },
]

const form = reactive({
  code: '',
  name: '',
  type: 'ukt' as FeeComponentType,
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
      form.type = props.component.type
      form.amount = props.component.amount
      form.is_periodic = props.component.is_periodic
      form.period_type = props.component.period_type ?? 'monthly'
      form.description = props.component.description ?? ''
    } else {
      form.code = ''
      form.name = ''
      form.type = 'ukt'
      form.amount = 0
      form.is_periodic = false
      form.period_type = 'monthly'
      form.description = ''
    }
  }
})

const saving = ref(false)

async function save() {
  if (!form.code.trim()) {
    toast.add({ title: 'Kode wajib diisi', color: 'warning' })
    return
  }
  if (!form.name.trim()) {
    toast.add({ title: 'Nama wajib diisi', color: 'warning' })
    return
  }
  if (form.amount <= 0) {
    toast.add({ title: 'Jumlah harus lebih dari 0', color: 'warning' })
    return
  }

  saving.value = true
  try {
    if (isEdit.value && props.component) {
      await store.updateFeeComponent(props.component.id, {
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
        type: form.type,
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
        <div class="mb-4 flex items-center justify-between">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {{ isEdit ? 'Edit Komponen Biaya' : 'Tambah Komponen Biaya' }}
          </h3>
          <UButton color="neutral" variant="ghost" icon="i-lucide-x" size="sm" square :disabled="saving" @click="close" />
        </div>

        <div class="space-y-4">
          <UFormField label="Kode" required>
            <UInput v-model="form.code" placeholder="Contoh: UKT-001" :disabled="isEdit" />
          </UFormField>
          <UFormField label="Nama" required>
            <UInput v-model="form.name" placeholder="Nama komponen biaya" />
          </UFormField>
          <UFormField label="Tipe" required>
            <USelect v-model="form.type" :items="typeOptions" :disabled="isEdit" />
          </UFormField>
          <UFormField label="Jumlah (Rp)" required>
            <UInput v-model.number="form.amount" type="number" placeholder="0" :min="0" />
          </UFormField>
          <UFormField label="Berkala">
            <USwitch v-model="form.is_periodic" class="mb-1" />
          </UFormField>
          <UFormField v-if="form.is_periodic" label="Periode">
            <USelect v-model="form.period_type" :items="periodOptions" />
          </UFormField>
          <UFormField label="Deskripsi">
            <UTextarea v-model="form.description" placeholder="Deskripsi (opsional)" :rows="2" />
          </UFormField>
        </div>

        <div class="mt-6 flex justify-end gap-2">
          <UButton color="neutral" variant="ghost" :disabled="saving" @click="close">Batal</UButton>
          <UButton color="primary" :loading="saving" @click="save">Simpan</UButton>
        </div>
      </div>
    </template>
  </UModal>
</template>
