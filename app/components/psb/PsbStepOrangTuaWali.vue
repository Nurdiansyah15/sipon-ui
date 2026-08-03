<script setup lang="ts">
import type { UpsertFormulirRequest } from '#shared/types/Psb'

const form = defineModel<UpsertFormulirRequest>({ required: true })
const emit = defineEmits<{ next: [], prev: [] }>()
</script>

<template>
  <div class="space-y-6">
    <!-- Ayah -->
    <div>
      <h4 class="mb-3 font-semibold text-gray-700 dark:text-gray-300">Data Ayah</h4>
      <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
        <UFormField label="Nama Ayah">
          <UInput v-model="form.father" placeholder="Nama lengkap" />
        </UFormField>
        <UFormField label="NIK Ayah">
          <UInput v-model="form.father_nik" placeholder="NIK" maxlength="20" />
        </UFormField>
        <UFormField label="Nomor Telepon">
          <UInput v-model="form.father_pn" placeholder="Nomor telepon" maxlength="20" />
        </UFormField>
        <UFormField label="Pekerjaan">
          <UInput v-model="form.father_job" placeholder="Pekerjaan" />
        </UFormField>
        <UFormField label="Pendidikan Terakhir">
          <UInput v-model="form.father_graduate" placeholder="Pendidikan terakhir" />
        </UFormField>
        <UFormField label="Penghasilan">
          <USelect v-model="form.father_income" :items="[
            { label: 'Pilih', value: null },
            { label: '< 1 juta', value: '<1jt' },
            { label: '1-3 juta', value: '1-3jt' },
            { label: '3-5 juta', value: '3-5jt' },
            { label: '5-10 juta', value: '5-10jt' },
            { label: '> 10 juta', value: '>10jt' },
          ]" />
        </UFormField>
      </div>
    </div>

    <UDivider />

    <!-- Ibu -->
    <div>
      <h4 class="mb-3 font-semibold text-gray-700 dark:text-gray-300">Data Ibu</h4>
      <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
        <UFormField label="Nama Ibu">
          <UInput v-model="form.mother" placeholder="Nama lengkap" />
        </UFormField>
        <UFormField label="NIK Ibu">
          <UInput v-model="form.mother_nik" placeholder="NIK" maxlength="20" />
        </UFormField>
        <UFormField label="Nomor Telepon">
          <UInput v-model="form.mother_pn" placeholder="Nomor telepon" maxlength="20" />
        </UFormField>
        <UFormField label="Pekerjaan">
          <UInput v-model="form.mother_job" placeholder="Pekerjaan" />
        </UFormField>
        <UFormField label="Pendidikan Terakhir">
          <UInput v-model="form.mother_graduate" placeholder="Pendidikan terakhir" />
        </UFormField>
        <UFormField label="Penghasilan">
          <USelect v-model="form.mother_income" :items="[
            { label: 'Pilih', value: null },
            { label: '< 1 juta', value: '<1jt' },
            { label: '1-3 juta', value: '1-3jt' },
            { label: '3-5 juta', value: '3-5jt' },
            { label: '5-10 juta', value: '5-10jt' },
            { label: '> 10 juta', value: '>10jt' },
          ]" />
        </UFormField>
      </div>
    </div>

    <UDivider />

    <!-- Wali -->
    <div>
      <h4 class="mb-3 font-semibold text-gray-700 dark:text-gray-300">Data Wali <span class="text-xs font-normal text-gray-400">(opsional, jika berbeda dari orang tua)</span></h4>
      <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
        <UFormField label="Hubungan">
          <UInput v-model="form.guardian_relationship" placeholder="Hubungan wali" />
        </UFormField>
        <UFormField label="Nama Wali">
          <UInput v-model="form.guardian" placeholder="Nama lengkap" />
        </UFormField>
        <UFormField label="NIK">
          <UInput v-model="form.guardian_nik" placeholder="NIK" maxlength="20" />
        </UFormField>
        <UFormField label="Nomor Telepon">
          <UInput v-model="form.guardian_pn" placeholder="Nomor telepon" maxlength="20" />
        </UFormField>
        <UFormField label="Pekerjaan">
          <UInput v-model="form.guardian_job" placeholder="Pekerjaan" />
        </UFormField>
        <UFormField label="Pendidikan Terakhir">
          <UInput v-model="form.guardian_graduate" placeholder="Pendidikan terakhir" />
        </UFormField>
        <UFormField label="Penghasilan">
          <USelect v-model="form.guardian_income" :items="[
            { label: 'Pilih', value: null },
            { label: '< 1 juta', value: '<1jt' },
            { label: '1-3 juta', value: '1-3jt' },
            { label: '3-5 juta', value: '3-5jt' },
            { label: '5-10 juta', value: '5-10jt' },
            { label: '> 10 juta', value: '>10jt' },
          ]" />
        </UFormField>
      </div>
    </div>

    <UDivider />

    <UFormField label="Pekerjaan / Jurusan" class="mb-3">
      <UInput v-model="form.workplace" placeholder="Tempat kerja / jurusan" />
    </UFormField>

    <UFormField label="Departemen / Bagian" class="mb-3">
      <UInput v-model="form.department" placeholder="Departemen / bagian" />
    </UFormField>

    <div class="flex justify-between pt-4">
      <UButton color="neutral" variant="ghost" @click="emit('prev')">Kembali</UButton>
      <UButton @click="emit('next')">Lanjut</UButton>
    </div>
  </div>
</template>
