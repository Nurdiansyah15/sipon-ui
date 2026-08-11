<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import { useKesantrianStore } from '~/stores/kesantrian'
import { useAkademikStore } from '~/stores/akademik'
import type { Program } from '#shared/types/Akademik'

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  'update:open': [boolean]
  created: []
}>()

const store = useKesantrianStore()
const akademikStore = useAkademikStore()
const toast = useToast()

const schema = z.object({
  nis: z
    .string()
    .regex(/^1000[12][0-9]{5}$/, 'Format NIS tidak valid (mis. 1000112345)'),
})
type Schema = z.output<typeof schema>

const state = reactive<Partial<Schema>>({
  nis: '',
})

const programs = ref<Program[]>([])
const programId = ref<string>('')
const defaultProgram = ref<Program | null>(null)

// Tahap: 'form' | 'password-reveal'
const stage = ref<'form' | 'password-reveal'>('form')
const generatedPassword = ref('')
const isSubmitting = ref(false)

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
  state.nis = ''
  programId.value = ''
  stage.value = 'form'
  generatedPassword.value = ''
}

function close() {
  resetState()
  emit('update:open', false)
  store.clearOneTimePassword()
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
    const res = await store.createSantri({
      nis: event.data.nis,
      program_id: programId.value || undefined,
    })
    generatedPassword.value = res.generated_password
    stage.value = 'password-reveal'
    toast.add({ title: 'Santri berhasil dibuat', color: 'success' })
    emit('created')
  } catch (err) {
    toast.add({
      title: 'Gagal membuat santri',
      description: store.error ?? undefined,
      color: 'error',
    })
  } finally {
    isSubmitting.value = false
  }
}

function onPasswordConfirmed() {
  close()
}
</script>

<template>
  <UModal
    :open="open"
    :dismissible="stage === 'form'"
    @update:open="(v: boolean) => emit('update:open', v)"
  >
    <template #content>
      <div class="p-6">
        <div class="mb-4 flex items-center justify-between">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Buat Santri Baru</h3>
          <UButton
            v-if="stage === 'form'"
            color="neutral"
            variant="ghost"
            icon="i-lucide-x"
            size="sm"
            square
            @click="close"
          />
        </div>

        <!-- Tahap 1: form input -->
        <UForm
          v-if="stage === 'form'"
          :schema="schema"
          :state="state"
          class="space-y-4"
          @submit="onSubmit"
        >
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
            <UButton type="submit" :loading="isSubmitting" icon="i-lucide-plus">Buat Santri</UButton>
          </div>
        </UForm>

        <!-- Tahap 2: reveal generated password -->
        <div v-else class="space-y-4">
          <AdminOneTimePasswordReveal
            :password="generatedPassword"
            title="Kata Sandi Sementara Santri"
            description="Salin kata sandi ini dan berikan kepada santri. Login memakai NIS sebagai username."
            @confirmed="onPasswordConfirmed"
          />
        </div>
      </div>
    </template>
  </UModal>
</template>
