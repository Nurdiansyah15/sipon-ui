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

function onNext(_e: FormSubmitEvent<z.output<typeof schema>>) {
  form.value.nickname = state.nickname
  emit('next')
}
</script>

<template>
  <UForm :schema="schema" :state="state" class="space-y-4" @submit="onNext">
    <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Data Pribadi</h3>
    <p class="text-sm text-gray-500">Isi data pribadi calon santri.</p>

    <UFormField label="Nama Panggilan" name="nickname" required>
      <UInput v-model="state.nickname" placeholder="Nama panggilan" autofocus />
    </UFormField>

    <UFormField label="Program" class="mb-3">
      <USelect v-model="form.program" :items="[
        { label: 'Pilih Program', value: null },
        { label: 'Tahfidz Putra', value: 'tahfidh_pa' },
        { label: 'Tahfidz Putri', value: 'tahfidh_pi' },
        { label: 'Kitab Putra', value: 'kitab_pa' },
        { label: 'Kitab Putri', value: 'kitab_pi' },
      ]" placeholder="Pilih program" />
    </UFormField>

    <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
      <UFormField label="Hobi">
        <UInput v-model="form.hobby" placeholder="Hobi" />
      </UFormField>
      <UFormField label="Cita-cita">
        <UInput v-model="form.purpose" placeholder="Cita-cita" />
      </UFormField>
    </div>

    <UFormField label="Motivasi Masuk Pondok" class="mb-3">
      <UTextarea v-model="form.motivation_entry" placeholder="Tulis motivasi Anda" :rows="3" />
    </UFormField>

    <div class="grid grid-cols-1 gap-3 md:grid-cols-3">
      <UFormField label="Tempat Lahir">
        <UInput v-model="form.pob" placeholder="Tempat lahir" />
      </UFormField>
      <UFormField label="Tanggal Lahir">
        <UInput v-model="form.dob" type="date" />
      </UFormField>
      <UFormField label="Golongan Darah">
        <USelect v-model="form.blood" :items="[
          { label: 'Pilih', value: null },
          { label: 'A', value: 'A' }, { label: 'B', value: 'B' }, { label: 'AB', value: 'AB' }, { label: 'O', value: 'O' },
        ]" />
      </UFormField>
    </div>

    <div class="flex justify-end pt-4">
      <UButton type="submit">Lanjut</UButton>
    </div>
  </UForm>
</template>
