<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import { useKeuanganAccountingStore } from '~/stores/keuanganAccounting'
import type { Account, AccountType, AccountSubType, NormalBalance } from '#shared/types/Keuangan'
import { SUB_TYPES_BY_TYPE, SUB_TYPE_LABELS } from '#shared/types/Keuangan'

const props = defineProps<{
  open: boolean
  mode: 'create' | 'edit'
  account?: Account | null
}>()

const emit = defineEmits<{
  'update:open': [boolean]
  success: []
}>()

const store = useKeuanganAccountingStore()
const toast = useToast()

const isSubmitting = ref(false)

const isSubTypeRequired = computed(() => props.mode === 'create' || props.account?.is_postable === true)

const schema = z.object({
  code: z.string().min(1, 'Kode akun wajib diisi'),
  name: z.string().min(1, 'Nama akun wajib diisi'),
  sub_type: z.string().optional(),
}).superRefine((data, ctx) => {
  if (isSubTypeRequired.value && !data.sub_type) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['sub_type'], message: 'Sub-tipe akun wajib diisi' })
  }
})

const code = ref('')
const name = ref('')
const type = ref<AccountType>('asset')
const subType = ref<AccountSubType | null>(null)
const parentId = ref<string | null>(null)
const normalBalance = ref<NormalBalance>('debit')
const isPostable = ref(false)
const description = ref('')

const typeOptions = [
  { label: 'Aset', value: 'asset' },
  { label: 'Kewajiban', value: 'liability' },
  { label: 'Ekuitas', value: 'equity' },
  { label: 'Pendapatan', value: 'revenue' },
  { label: 'Beban', value: 'expense' },
]

const normalBalanceOptions = [
  { label: 'Debit', value: 'debit' },
  { label: 'Kredit', value: 'credit' },
]

const subTypeOptions = computed(() =>
  (SUB_TYPES_BY_TYPE[type.value] || []).map((st) => ({
    label: SUB_TYPE_LABELS[st],
    value: st,
  })),
)

function reset() {
  if (props.mode === 'edit' && props.account) {
    code.value = props.account.code
    name.value = props.account.name
    type.value = props.account.type
    subType.value = props.account.sub_type
    parentId.value = props.account.parent_id
    normalBalance.value = props.account.normal_balance
    isPostable.value = props.account.is_postable
    description.value = props.account.description || ''
  } else {
    code.value = ''
    name.value = ''
    type.value = 'asset'
    subType.value = null
    parentId.value = null
    normalBalance.value = 'debit'
    isPostable.value = false
    description.value = ''
  }
}

watch(() => props.open, (v) => { if (v) reset() })

watch(() => type.value, () => {
  if (props.mode === 'create') subType.value = null
})

async function onSubmit(_e: FormSubmitEvent<z.output<typeof schema>>) {
  isSubmitting.value = true
  try {
    if (props.mode === 'edit' && props.account) {
      await store.updateAccount(props.account.id, {
        name: name.value,
        sub_type: subType.value || undefined,
        description: description.value || undefined,
        is_postable: isPostable.value,
      })
      toast.add({ title: 'Akun berhasil diperbarui', color: 'success' })
    } else {
      await store.createAccount({
        code: code.value,
        name: name.value,
        type: type.value,
        sub_type: subType.value || undefined,
        parent_id: parentId.value || undefined,
        normal_balance: normalBalance.value,
        is_postable: isPostable.value,
        description: description.value || undefined,
      })
      toast.add({ title: 'Akun berhasil dibuat', color: 'success' })
    }
    emit('update:open', false)
    emit('success')
  } catch (err) {
    toast.add({ title: 'Gagal', description: store.error || undefined, color: 'error' })
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <UModal :open="open" :dismissible="!isSubmitting" @update:open="v => !isSubmitting && emit('update:open', v)">
    <template #content>
      <div class="max-h-[80vh] overflow-y-auto p-6">
        <div class="mb-5 flex items-center justify-between">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {{ mode === 'edit' ? 'Edit Akun' : 'Buat Akun Baru' }}
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

        <UForm :schema="schema" :state="{ code, name, sub_type: subType }" class="space-y-4" @submit="onSubmit">
          <div class="grid grid-cols-2 gap-3">
            <UFormField label="Kode Akun" name="code" required>
              <UInput
                v-model="code"
                placeholder="1000"
                :disabled="mode === 'edit'"
                variant="subtle"
                class="w-full"
              />
            </UFormField>
            <UFormField label="Nama Akun" name="name" required>
              <UInput v-model="name" placeholder="Nama akun" variant="subtle" class="w-full" />
            </UFormField>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <UFormField label="Tipe Akun">
              <USelect
                v-model="type"
                :items="typeOptions"
                :disabled="mode === 'edit'"
                value-key="value"
                variant="subtle"
                class="w-full"
              />
            </UFormField>
            <UFormField label="Saldo Normal">
              <USelect
                v-model="normalBalance"
                :items="normalBalanceOptions"
                :disabled="mode === 'edit'"
                value-key="value"
                variant="subtle"
                class="w-full"
              />
            </UFormField>
          </div>

          <UFormField label="Sub-Tipe Akun" name="sub_type" :required="isSubTypeRequired">
            <USelect
              v-model="subType"
              :items="subTypeOptions"
              :disabled="mode === 'edit' && !account?.is_postable"
              :placeholder="mode === 'edit' && !account?.is_postable ? 'Tidak diperlukan' : 'Pilih sub-tipe'"
              value-key="value"
              variant="subtle"
              class="w-full"
            />
          </UFormField>

          <UFormField label="Akun Induk (opsional)">
            <KeuanganAccountPicker
              :model-value="parentId"
              placeholder="Pilih akun induk..."
              @update:model-value="(val) => parentId = val"
            />
          </UFormField>

          <div class="flex items-center gap-2">
            <UCheckbox v-model="isPostable" :disabled="mode === 'edit'" />
            <span class="text-sm text-gray-700 dark:text-gray-300">Postable (dapat digunakan di jurnal)</span>
          </div>

          <UFormField label="Deskripsi">
            <UTextarea v-model="description" placeholder="Deskripsi akun (opsional)" :rows="2" variant="subtle" class="w-full" />
          </UFormField>

          <div class="flex justify-end gap-2 border-t border-gray-200 pt-4 dark:border-gray-700">
            <UButton color="neutral" variant="outline" :disabled="isSubmitting" @click="emit('update:open', false)">
              Batal
            </UButton>
            <UButton type="submit" :loading="isSubmitting" color="primary">
              {{ mode === 'edit' ? 'Simpan Perubahan' : 'Buat Akun' }}
            </UButton>
          </div>
        </UForm>
      </div>
    </template>
  </UModal>
</template>
