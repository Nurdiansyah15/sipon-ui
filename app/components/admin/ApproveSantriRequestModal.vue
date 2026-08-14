<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import { useKesantrianStore } from '~/stores/kesantrian'
import { useAkademikStore } from '~/stores/akademik'
import type { Program } from '#shared/types/Akademik'

const props = defineProps<{
  open: boolean
  requestId: string
  requestName: string
}>()

const emit = defineEmits<{
  'update:open': [boolean]
  approved: []
}>()

const store = useKesantrianStore()
const akademikStore = useAkademikStore()
const toast = useToast()

const schema = z.object({
  gender: z.string().min(1, 'Jenis kelamin wajib dipilih'),
  nis: z
    .string()
    .regex(/^1000[12][0-9]{5}$/, 'Format NIS tidak valid (mis. 1000112345)'),
})
type Schema = z.output<typeof schema>

const genderOptions = [
  { label: 'Laki-laki', value: '1' },
  { label: 'Perempuan', value: '2' },
]

const state = reactive<Partial<Schema>>({ gender: '', nis: '' })
const isSubmitting = ref(false)

// Mengisi prefix NIS sesuai gender: '1000' + digit gender ('1'/'2').
function applyGenderPrefix() {
  if (!state.gender) return
  const digit = state.gender === '2' ? '2' : '1'
  const cur = (state.nis || '').trim()
  const rest = /^1000[12]/.test(cur) ? cur.slice(5) : ''
  state.nis = `1000${digit}${rest}`
}

const programs = ref<Program[]>([])
const programId = ref<string>('')
const defaultProgram = ref<Program | null>(null)

async function loadPrograms() {
  try {
    const settings = await akademikStore.fetchAkademikSettings()
    defaultProgram.value = settings.default_program ?? null
    await akademikStore.fetchPrograms({ status: 'active', limit: 100 })
    programs.value = akademikStore.programs
    programId.value = ''
  } catch {
    programs.value = []
    defaultProgram.value = null
  }
}

function resetState() {
  state.gender = ''
  state.nis = ''
  programId.value = ''
}

function close() {
  resetState()
  emit('update:open', false)
}

watch(
  () => props.open,
  (open) => {
    if (open) {
      resetState()
      loadPrograms()
    }
  },
)

async function onSubmit(event: FormSubmitEvent<Schema>) {
  isSubmitting.value = true
  try {
    await store.approveSantriRequest(props.requestId, {
      nis: event.data.nis,
      gender: event.data.gender,
      program_id: programId.value || undefined,
    })
    toast.add({ title: 'Permintaan santri disetujui', color: 'success' })
    emit('approved')
    close()
  } catch (err) {
    toast.add({
      title: 'Gagal menyetujui permintaan',
      description: store.error ?? undefined,
      color: 'error',
    })
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <UModal :open="open" @update:open="(v: boolean) => emit('update:open', v)">
    <template #content>
      <div class="p-6">
        <div class="mb-4 flex items-center justify-between">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Setujui Permintaan Santri</h3>
          <UButton color="neutral" variant="ghost" icon="i-lucide-x" size="sm" square @click="close" />
        </div>

        <p class="mb-4 text-sm text-gray-700 dark:text-gray-300">
          Menyetujui permintaan dari <strong>{{ requestName }}</strong>. Masukkan NIS untuk membuat profil santri.
        </p>

        <UForm :schema="schema" :state="state" class="space-y-4" @submit="onSubmit">
          <UFormField label="Jenis Kelamin" name="gender" required>
            <USelect
              v-model="state.gender"
              :items="genderOptions"
              placeholder="Pilih jenis kelamin"
              variant="subtle"
              class="w-full"
              @change="applyGenderPrefix"
            />
          </UFormField>

          <UFormField label="NIS" name="nis" required description="Nomor Induk Santri, 10 digit (mis. 1000112345)">
            <UInput v-model="state.nis" class="w-full" variant="subtle" placeholder="1000112345" />
          </UFormField>

          <UFormField
            label="Program"
            name="program_id"
            :hint="defaultProgram
              ? `Kosongkan untuk memakai program default (${defaultProgram.code} — ${defaultProgram.name})`
              : 'Pilih program untuk santri'"
          >
            <USelect
              v-model="programId"
              :items="programs.map((p) => ({ label: `${p.code} — ${p.name}`, value: p.id }))"
              placeholder="Gunakan program default"
              variant="subtle"
              class="w-full"
            />
          </UFormField>

          <div class="flex justify-end gap-2 pt-2">
            <UButton color="neutral" variant="ghost" type="button" @click="close">Batal</UButton>
            <UButton type="submit" color="success" :loading="isSubmitting" icon="i-lucide-check">Setujui</UButton>
          </div>
        </UForm>
      </div>
    </template>
  </UModal>
</template>
