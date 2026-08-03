<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import { usePsbSettingStore } from '~/stores/psbSetting'
import { parseApiError } from '~/utils/errorParser'
import type { SettingResponse, PsbQuota, PsbBankAccount } from '#shared/types/Psb'

const props = defineProps<{
  open: boolean
  edit?: SettingResponse | null
}>()

const emit = defineEmits<{
  'update:open': [boolean]
  done: []
}>()

const store = usePsbSettingStore()
const toast = useToast()

const isSubmitting = ref(false)

const settingSchema = z.object({
  name: z.string().min(1, 'Nama periode wajib diisi'),
  startPeriod: z.string().min(1, 'Tanggal mulai wajib diisi'),
  endPeriod: z.string().min(1, 'Tanggal selesai wajib diisi'),
})

const name = ref('')
const startPeriod = ref('')
const endPeriod = ref('')
const regFee = ref(0)

const quotaEntries = ref<{ key: string; value: number }[]>([])
const bankEntries = ref<{ name: string; no: string }[]>([])

function reset() {
  name.value = props.edit?.name ?? ''
  startPeriod.value = props.edit?.start_period ?? ''
  endPeriod.value = props.edit?.end_period ?? ''
  regFee.value = props.edit?.reg_fee ?? 0

  quotaEntries.value = []
  if (props.edit?.quota) {
    for (const [k, v] of Object.entries(props.edit.quota)) {
      quotaEntries.value.push({ key: k, value: v })
    }
  }

  bankEntries.value = []
  if (props.edit?.bank_accounts) {
    for (const b of props.edit.bank_accounts) {
      bankEntries.value.push({ ...b })
    }
  }
}

watch(() => props.open, (v) => { if (v) reset() })

function addQuota() {
  quotaEntries.value.push({ key: '', value: 0 })
}

function removeQuota(idx: number) {
  quotaEntries.value.splice(idx, 1)
}

function addBank() {
  bankEntries.value.push({ name: '', no: '' })
}

function removeBank(idx: number) {
  bankEntries.value.splice(idx, 1)
}

function buildQuota(): PsbQuota {
  const q: PsbQuota = {}
  for (const e of quotaEntries.value) {
    if (e.key.trim()) q[e.key.trim()] = e.value
  }
  return q
}

function buildBanks(): PsbBankAccount[] {
  return bankEntries.value.filter(b => b.name.trim() && b.no.trim())
}

async function onSubmit(_e: FormSubmitEvent<z.output<typeof settingSchema>>) {
  isSubmitting.value = true
  try {
    const quota = buildQuota()
    const bank_accounts = buildBanks()

    if (props.edit) {
      await store.updateSetting(props.edit.id, {
        name: name.value || undefined,
        start_period: startPeriod.value || undefined,
        end_period: endPeriod.value || undefined,
        reg_fee: regFee.value,
        quota: Object.keys(quota).length > 0 ? quota : undefined,
        bank_accounts: bank_accounts.length > 0 ? bank_accounts : undefined,
      })
      toast.add({ title: 'Periode diupdate', color: 'success' })
    } else {
      await store.createSetting({
        name: name.value,
        start_period: startPeriod.value,
        end_period: endPeriod.value,
        reg_fee: regFee.value,
        quota: Object.keys(quota).length > 0 ? quota : undefined,
        bank_accounts: bank_accounts.length > 0 ? bank_accounts : undefined,
      })
      toast.add({ title: 'Periode dibuat', color: 'success' })
    }

    emit('update:open', false)
    emit('done')
  } catch (err) {
    toast.add({ title: 'Gagal', description: parseApiError(err), color: 'error' })
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <UModal :open="open" :dismissible="!isSubmitting" @update:open="v => !isSubmitting && emit('update:open', v)">
    <template #content>
      <div class="max-h-[80vh] overflow-y-auto p-6">
        <div class="mb-4 flex items-center justify-between">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">{{ edit ? 'Edit Periode' : 'Buat Periode' }}</h3>
          <UButton v-if="!isSubmitting" color="neutral" variant="ghost" icon="i-lucide-x" size="sm" square @click="emit('update:open', false)" />
        </div>

        <UForm :schema="settingSchema" :state="{ name, startPeriod, endPeriod }" class="space-y-4" @submit="onSubmit">
          <UFormField label="Nama Periode" name="name" required>
            <UInput v-model="name" placeholder="PSB 2026/2027" />
          </UFormField>

          <div class="grid grid-cols-2 gap-3">
            <UFormField label="Tanggal Mulai" name="startPeriod" required>
              <UInput v-model="startPeriod" type="date" />
            </UFormField>
            <UFormField label="Tanggal Selesai" name="endPeriod" required>
              <UInput v-model="endPeriod" type="date" />
            </UFormField>
          </div>

          <UFormField label="Biaya Pendaftaran">
            <UInput v-model.number="regFee" type="number" />
          </UFormField>

          <UDivider label="Kuota per Program" />

          <div class="space-y-2">
            <div v-for="(item, idx) in quotaEntries" :key="idx" class="flex gap-2">
              <UInput v-model="item.key" placeholder="key (cth: tahfidh_pa)" class="flex-1" />
              <UInput v-model.number="item.value" type="number" placeholder="kuota" class="w-24" />
              <UButton color="error" variant="ghost" icon="i-lucide-trash-2" size="xs" square @click="removeQuota(idx)" />
            </div>
            <UButton variant="soft" size="xs" icon="i-lucide-plus" @click="addQuota">Tambah Kuota</UButton>
          </div>

          <UDivider label="Rekening Bank" />

          <div class="space-y-2">
            <div v-for="(item, idx) in bankEntries" :key="idx" class="flex gap-2">
              <UInput v-model="item.name" placeholder="Nama Bank" class="flex-1" />
              <UInput v-model="item.no" placeholder="No. Rekening" class="flex-1" />
              <UButton color="error" variant="ghost" icon="i-lucide-trash-2" size="xs" square @click="removeBank(idx)" />
            </div>
            <UButton variant="soft" size="xs" icon="i-lucide-plus" @click="addBank">Tambah Rekening</UButton>
          </div>

          <div class="flex justify-end gap-2">
            <UButton color="neutral" variant="ghost" :disabled="isSubmitting" @click="emit('update:open', false)">Batal</UButton>
            <UButton type="submit" :loading="isSubmitting">
              {{ edit ? 'Simpan' : 'Buat' }}
            </UButton>
          </div>
        </UForm>
      </div>
    </template>
  </UModal>
</template>
