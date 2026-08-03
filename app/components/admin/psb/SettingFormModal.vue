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

const PROGRAM_OPTIONS = [
  { key: 'tahfidh_pa', label: 'Tahfidz Putra' },
  { key: 'tahfidh_pi', label: 'Tahfidz Putri' },
  { key: 'reguler_pa', label: 'Reguler Putra' },
  { key: 'reguler_pi', label: 'Reguler Putri' },
  { key: 'smp', label: 'SMP' },
  { key: 'mts', label: 'MTs' },
  { key: 'ma', label: 'MA' },
]

function programLabel(key: string): string {
  return PROGRAM_OPTIONS.find(p => p.key === key)?.label ?? key
}

const name = ref('')
const startPeriod = ref('')
const endPeriod = ref('')
const regFee = ref(0)

const regFeeDisplay = computed({
  get: () => (regFee.value === 0 ? '' : regFee.value.toLocaleString('id-ID')),
  set: (v: string) => {
    const num = parseInt(v.replace(/\D/g, ''), 10)
    regFee.value = isNaN(num) ? 0 : num
  },
})

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

const usedProgramKeys = computed(() => new Set(quotaEntries.value.filter(e => e.key).map(e => e.key)))
const availablePrograms = computed(() =>
  PROGRAM_OPTIONS.filter(p => !usedProgramKeys.value.has(p.key))
)

function addQuota() {
  const next = availablePrograms.value[0]
  if (next) {
    quotaEntries.value.push({ key: next.key, value: 0 })
  }
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
        <div class="mb-5 flex items-center justify-between">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">{{ edit ? 'Edit Periode' : 'Buat Periode PSB' }}</h3>
          <UButton v-if="!isSubmitting" color="neutral" variant="ghost" icon="i-lucide-x" size="sm" square @click="emit('update:open', false)" />
        </div>

        <UForm :schema="settingSchema" :state="{ name, startPeriod, endPeriod }" class="space-y-6" @submit="onSubmit">

          <!-- Section: Informasi Periode -->
          <div class="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
            <h4 class="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Informasi Periode
            </h4>

            <UFormField label="Nama Periode" name="name" required>
              <UInput v-model="name" class="w-full" placeholder="cth: PSB 2026/2027 Gelombang 1" variant="subtle" />
            </UFormField>

            <div class="mt-3 grid grid-cols-2 gap-3">
              <UFormField label="Tanggal Mulai" name="startPeriod" required>
                <UInput v-model="startPeriod" type="date" variant="subtle" class="w-full" />
              </UFormField>
              <UFormField label="Tanggal Selesai" name="endPeriod" required>
                <UInput v-model="endPeriod" type="date" variant="subtle" class="w-full" />
              </UFormField>
            </div>
          </div>

          <!-- Section: Biaya & Kuota -->
          <div class="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
            <h4 class="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Biaya & Kuota
            </h4>

            <UFormField label="Biaya Pendaftaran" hint="Biaya per pendaftar">
              <UInput
                v-model="regFeeDisplay"
                placeholder="0"
                variant="subtle"
                class="flex-1"
                inputmode="numeric"
                @blur="regFeeDisplay = regFee === 0 ? '' : regFee.toLocaleString('id-ID')"
              />
            </UFormField>

            <div class="mt-4">
              <div class="mb-2 flex items-center justify-between">
                <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Kuota per Program</span>
                <UButton
                  v-if="availablePrograms.length > 0"
                  variant="ghost"
                  size="xs"
                  icon="i-lucide-plus"
                  color="primary"
                  @click="addQuota"
                >
                  Tambah
                </UButton>
              </div>

              <div v-if="quotaEntries.length === 0" class="rounded-md bg-gray-50 p-3 text-center text-xs text-gray-400 dark:bg-gray-800">
                Belum ada kuota program
              </div>

              <div v-else class="space-y-2">
                <div v-for="(item, idx) in quotaEntries" :key="idx" class="flex items-center gap-2">
                  <div class="flex-1">
                    <USelect
                      v-model="item.key"
                      :items="PROGRAM_OPTIONS"
                      value-key="key"
                      label-key="label"
                      placeholder="Pilih program"
                      variant="subtle"
                      class="w-full"
                    />
                  </div>
                  <UInput
                    v-model.number="item.value"
                    type="number"
                    placeholder="0"
                    variant="subtle"
                    class="w-20"
                    min="0"
                  />
                  <span class="text-xs text-gray-400">orang</span>
                  <UButton color="neutral" variant="ghost" icon="i-lucide-x" size="xs" square @click="removeQuota(idx)" />
                </div>
              </div>
            </div>
          </div>

          <!-- Section: Rekening Bank -->
          <div class="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
            <h4 class="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Rekening Bank
            </h4>

            <div v-if="bankEntries.length === 0" class="rounded-md bg-gray-50 p-3 text-center text-xs text-gray-400 dark:bg-gray-800">
              Belum ada rekening bank
            </div>

            <div v-else class="space-y-2">
              <div v-for="(item, idx) in bankEntries" :key="idx" class="flex items-center gap-2">
                <UInput v-model="item.name" placeholder="Nama Bank" variant="subtle" class="flex-1" />
                <UInput v-model="item.no" placeholder="No. Rekening" variant="subtle" class="w-40" />
                <UButton color="neutral" variant="ghost" icon="i-lucide-x" size="xs" square @click="removeBank(idx)" />
              </div>
            </div>

            <UButton variant="ghost" size="xs" icon="i-lucide-plus" color="primary" class="mt-2" @click="addBank">
              Tambah Rekening
            </UButton>
          </div>

          <!-- Actions -->
          <div class="flex justify-end gap-2 border-t border-gray-200 pt-4 dark:border-gray-700">
            <UButton color="neutral" variant="outline" :disabled="isSubmitting" @click="emit('update:open', false)">Batal</UButton>
            <UButton type="submit" :loading="isSubmitting" color="primary">
              {{ edit ? 'Simpan Perubahan' : 'Buat Periode' }}
            </UButton>
          </div>
        </UForm>
      </div>
    </template>
  </UModal>
</template>
