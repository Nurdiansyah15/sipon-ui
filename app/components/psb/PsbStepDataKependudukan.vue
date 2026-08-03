<script setup lang="ts">
import type { UpsertFormulirRequest } from '#shared/types/Psb'

const form = defineModel<UpsertFormulirRequest>({ required: true })
const emit = defineEmits<{ next: [], prev: [] }>()
</script>

<template>
  <div class="space-y-4">
    <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Data Kependudukan</h3>
    <p class="text-sm text-gray-500">Isi data kependudukan dan identitas calon santri.</p>

    <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
      <UFormField label="NIK">
        <UInput v-model="form.nik" placeholder="Nomor Induk Kependudukan" maxlength="20" />
      </UFormField>
      <UFormField label="No. KK">
        <UInput v-model="form.no_kk" placeholder="Nomor Kartu Keluarga" maxlength="20" />
      </UFormField>
    </div>

    <UFormField label="NISN" class="mb-3">
      <UInput v-model="form.nisn" placeholder="Nomor Induk Siswa Nasional" maxlength="10" />
    </UFormField>

    <UDivider label="Data Bantuan (opsional)" class="my-6" />

    <div class="grid grid-cols-1 gap-3 md:grid-cols-3">
      <UFormField label="No. KIP">
        <UInput v-model="form.no_kip" placeholder="KIP" maxlength="20" />
      </UFormField>
      <UFormField label="No. KKS">
        <UInput v-model="form.no_kks" placeholder="KKS" maxlength="20" />
      </UFormField>
      <UFormField label="No. PKH">
        <UInput v-model="form.no_pkh" placeholder="PKH" maxlength="20" />
      </UFormField>
    </div>

    <div class="flex justify-between pt-4">
      <UButton color="neutral" variant="ghost" @click="emit('prev')">Kembali</UButton>
      <UButton @click="emit('next')">Lanjut</UButton>
    </div>
  </div>
</template>
