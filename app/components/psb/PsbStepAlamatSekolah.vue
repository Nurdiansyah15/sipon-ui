<script setup lang="ts">
import type { UpsertFormulirRequest } from '#shared/types/Psb'

const form = defineModel<UpsertFormulirRequest>({ required: true })
const emit = defineEmits<{ next: [], prev: [] }>()
</script>

<template>
  <div class="space-y-4">
    <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Alamat & Sekolah Sebelumnya</h3>
    <p class="text-sm text-gray-500">Isi alamat tempat tinggal dan riwayat pondok/pendidikan sebelumnya.</p>

    <UFormField label="Alamat Lengkap" class="mb-3">
      <UTextarea v-model="form.address" placeholder="Alamat lengkap" :rows="2" />
    </UFormField>

    <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
      <UFormField label="Kelurahan">
        <UInput v-model="form.sub_district" placeholder="Kelurahan" />
      </UFormField>
      <UFormField label="Kecamatan">
        <UInput v-model="form.district" placeholder="Kecamatan" />
      </UFormField>
    </div>

    <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
      <UFormField label="Provinsi">
        <UInput v-model="form.province" placeholder="Provinsi" />
      </UFormField>
      <UFormField label="Kode Pos">
        <UInput v-model="form.postal_code" placeholder="Kode pos" />
      </UFormField>
    </div>

    <UDivider label="Riwayat Pendidikan" class="my-6" />

    <UFormField label="Nama Pondok / Sekolah Sebelumnya" class="mb-3">
      <UInput v-model="form.previous_pondok_name" placeholder="Nama pondok / sekolah" />
    </UFormField>

    <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
      <UFormField label="Alamat">
        <UInput v-model="form.previous_pondok_address" placeholder="Alamat" />
      </UFormField>
      <UFormField label="Divisi / Jurusan">
        <UInput v-model="form.previous_pondok_div" placeholder="Divisi / jurusan" />
      </UFormField>
    </div>

    <UFormField label="Lama Waktu" class="mb-3">
      <UInput v-model="form.previous_pondok_time" placeholder="Contoh: 3 tahun" />
    </UFormField>

    <div class="flex justify-between pt-4">
      <UButton color="neutral" variant="ghost" @click="emit('prev')">Kembali</UButton>
      <UButton @click="emit('next')">Lanjut</UButton>
    </div>
  </div>
</template>
