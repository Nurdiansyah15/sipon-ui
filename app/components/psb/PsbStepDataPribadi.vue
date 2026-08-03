<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import type { UpsertFormulirRequest } from '#shared/types/Psb'

const form = defineModel<UpsertFormulirRequest>({ required: true })
const emit = defineEmits<{ next: [] }>()

const schema = z.object({
  nickname: z.string().min(1, 'Nama panggilan wajib diisi'),
})

const state = reactive({ nickname: form.value.nickname || '' })

const programOptions = [
  { label: 'Tahfidz Putra', value: 'tahfidh_pa' },
  { label: 'Tahfidz Putri', value: 'tahfidh_pi' },
  { label: 'Kitab Putra', value: 'kitab_pa' },
  { label: 'Kitab Putri', value: 'kitab_pi' },
]

const bloodOptions = [
  { label: '-', value: null },
  { label: 'A', value: 'A' }, { label: 'B', value: 'B' }, { label: 'AB', value: 'AB' }, { label: 'O', value: 'O' },
]

function onNext(_e: FormSubmitEvent<z.output<typeof schema>>) {
  form.value.nickname = state.nickname
  emit('next')
}
</script>

<template>
  <UForm :schema="schema" :state="state" class="space-y-6" @submit="onNext">

    <div class="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700/50 dark:bg-gray-900">
      <div class="mb-5 flex items-center gap-3">
        <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-50 dark:bg-teal-950">
          <UIcon name="i-lucide-user" class="h-5 w-5 text-teal-600 dark:text-teal-400" />
        </div>
        <div>
          <h3 class="font-semibold text-gray-900 dark:text-gray-100">Data Pribadi</h3>
          <p class="text-sm text-gray-500">Isi identitas dasar calon santri.</p>
        </div>
      </div>

      <div class="space-y-4">
        <div class="grid gap-4 md:grid-cols-2">
          <UFormField label="Nama Panggilan" name="nickname" required>
            <UInput v-model="state.nickname" placeholder="cth: Ahmad" variant="subtle" autofocus class="w-full" />
          </UFormField>

          <UFormField label="Program">
            <USelect v-model="form.program" :items="programOptions" placeholder="Pilih program" variant="subtle" class="w-full" />
          </UFormField>
        </div>

        <div class="grid gap-4 md:grid-cols-2">
          <UFormField label="Hobi">
            <UInput v-model="form.hobby" placeholder="cth: Membaca, Olahraga" variant="subtle" class="w-full" />
          </UFormField>

          <UFormField label="Cita-cita">
            <UInput v-model="form.purpose" placeholder="cth: Hafidz Qur'an" variant="subtle" class="w-full" />
          </UFormField>
        </div>

        <UFormField label="Motivasi Masuk Pondok">
          <UTextarea v-model="form.motivation_entry" placeholder="Tulis alasan dan motivasi Anda" :rows="3" variant="subtle" class="w-full" />
        </UFormField>

        <div class="grid gap-4 md:grid-cols-3">
          <UFormField label="Tempat Lahir">
            <UInput v-model="form.pob" placeholder="cth: Jakarta" variant="subtle" class="w-full" />
          </UFormField>
          <UFormField label="Tanggal Lahir">
            <UInput v-model="form.dob" type="date" variant="subtle" class="w-full" />
          </UFormField>
          <UFormField label="Golongan Darah">
            <USelect v-model="form.blood" :items="bloodOptions" variant="subtle" class="w-full" />
          </UFormField>
        </div>
      </div>
    </div>

    <div class="flex justify-end">
      <UButton type="submit" size="md" trailing-icon="i-lucide-arrow-right">Lanjut</UButton>
    </div>

  </UForm>
</template>
