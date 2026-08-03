<script setup lang="ts">
import type { UpsertFormulirRequest } from '#shared/types/Psb'

const form = defineModel<UpsertFormulirRequest>({ required: true })
const emit = defineEmits<{ next: [], prev: [] }>()
</script>

<template>
  <div class="space-y-6">

    <div class="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700/50 dark:bg-gray-900">
      <div class="mb-5 flex items-center gap-3">
        <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-50 dark:bg-teal-950">
          <UIcon name="i-lucide-home" class="h-5 w-5 text-teal-600 dark:text-teal-400" />
        </div>
        <div>
          <h3 class="font-semibold text-gray-900 dark:text-gray-100">Alamat Tempat Tinggal</h3>
          <p class="text-sm text-gray-500">Isi alamat domisili calon santri.</p>
        </div>
      </div>

      <div class="space-y-4">
        <UFormField label="Alamat Lengkap">
          <UTextarea v-model="form.address" placeholder="Jalan, RT/RW, Desa/Kelurahan" :rows="2" variant="subtle" class="w-full" />
        </UFormField>

        <div class="grid gap-4 md:grid-cols-3">
          <UFormField label="Kelurahan">
            <UInput v-model="form.sub_district" placeholder="Kelurahan" variant="subtle" class="w-full" />
          </UFormField>
          <UFormField label="Kecamatan">
            <UInput v-model="form.district" placeholder="Kecamatan" variant="subtle" class="w-full" />
          </UFormField>
          <UFormField label="Kode Pos">
            <UInput v-model="form.postal_code" placeholder="Kode pos" variant="subtle" maxlength="5" class="w-full" />
          </UFormField>
        </div>

        <UFormField label="Provinsi">
          <UInput v-model="form.province" placeholder="Provinsi" variant="subtle" class="w-full md:w-1/2" />
        </UFormField>
      </div>
    </div>

    <div class="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700/50 dark:bg-gray-900">
      <div class="mb-5 flex items-center gap-3">
        <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-50 dark:bg-teal-950">
          <UIcon name="i-lucide-graduation-cap" class="h-5 w-5 text-teal-600 dark:text-teal-400" />
        </div>
        <div>
          <h3 class="font-semibold text-gray-900 dark:text-gray-100">Riwayat Pendidikan</h3>
          <p class="text-sm text-gray-500">Pondok atau sekolah terakhir yang pernah ditempuh.</p>
        </div>
      </div>

      <div class="space-y-4">
        <div class="grid gap-4 md:grid-cols-2">
          <UFormField label="Nama Pondok / Sekolah Sebelumnya">
            <UInput v-model="form.previous_pondok_name" placeholder="Nama pondok / sekolah" variant="subtle" class="w-full" />
          </UFormField>
          <UFormField label="Alamat">
            <UInput v-model="form.previous_pondok_address" placeholder="Alamat pondok / sekolah" variant="subtle" class="w-full" />
          </UFormField>
        </div>

        <div class="grid gap-4 md:grid-cols-2">
          <UFormField label="Divisi / Jurusan">
            <UInput v-model="form.previous_pondok_div" placeholder="Divisi / jurusan" variant="subtle" class="w-full" />
          </UFormField>
          <UFormField label="Lama Menempuh">
            <UInput v-model="form.previous_pondok_time" placeholder="cth: 3 tahun" variant="subtle" class="w-full" />
          </UFormField>
        </div>
      </div>
    </div>

    <div class="flex justify-between">
      <UButton color="neutral" variant="ghost" leading-icon="i-lucide-arrow-left" @click="emit('prev')">Kembali</UButton>
      <UButton trailing-icon="i-lucide-arrow-right" @click="emit('next')">Lanjut</UButton>
    </div>

  </div>
</template>
