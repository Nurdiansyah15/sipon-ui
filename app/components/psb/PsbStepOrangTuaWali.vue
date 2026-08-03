<script setup lang="ts">
import type { UpsertFormulirRequest } from '#shared/types/Psb'

const form = defineModel<UpsertFormulirRequest>({ required: true })
const emit = defineEmits<{ next: [], prev: [] }>()

const incomeOptions = [
  { label: '-', value: null },
  { label: '< 1 juta', value: '<1jt' },
  { label: '1 - 3 juta', value: '1-3jt' },
  { label: '3 - 5 juta', value: '3-5jt' },
  { label: '5 - 10 juta', value: '5-10jt' },
  { label: '> 10 juta', value: '>10jt' },
]
</script>

<template>
  <div class="space-y-6">

    <!-- Ayah & Ibu side by side on wide screens -->
    <div class="grid gap-6 lg:grid-cols-2">
      <div class="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700/50 dark:bg-gray-900">
        <div class="mb-5 flex items-center gap-3">
          <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-50 dark:bg-teal-950">
            <UIcon name="i-lucide-user-round" class="h-5 w-5 text-teal-600 dark:text-teal-400" />
          </div>
          <div>
            <h3 class="font-semibold text-gray-900 dark:text-gray-100">Data Ayah</h3>
            <p class="text-sm text-gray-500">Identitas dan informasi ayah kandung.</p>
          </div>
        </div>

        <div class="space-y-4">
          <UFormField label="Nama Ayah">
            <UInput v-model="form.father" placeholder="Nama lengkap ayah" variant="subtle" class="w-full" />
          </UFormField>

          <div class="grid gap-4 sm:grid-cols-2">
            <UFormField label="NIK">
              <UInput v-model="form.father_nik" placeholder="NIK" variant="subtle" maxlength="16" inputmode="numeric" class="w-full" />
            </UFormField>
            <UFormField label="No. Telepon">
              <UInput v-model="form.father_pn" placeholder="Nomor telepon" variant="subtle" maxlength="15" class="w-full" />
            </UFormField>
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <UFormField label="Pekerjaan">
              <UInput v-model="form.father_job" placeholder="Pekerjaan" variant="subtle" class="w-full" />
            </UFormField>
            <UFormField label="Pendidikan Terakhir">
              <UInput v-model="form.father_graduate" placeholder="cth: S1, SMA" variant="subtle" class="w-full" />
            </UFormField>
          </div>

          <UFormField label="Penghasilan Per Bulan">
            <USelect v-model="form.father_income" :items="incomeOptions" variant="subtle" class="w-full" />
          </UFormField>
        </div>
      </div>

      <div class="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700/50 dark:bg-gray-900">
        <div class="mb-5 flex items-center gap-3">
          <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-50 dark:bg-teal-950">
            <UIcon name="i-lucide-user-round" class="h-5 w-5 text-teal-600 dark:text-teal-400" />
          </div>
          <div>
            <h3 class="font-semibold text-gray-900 dark:text-gray-100">Data Ibu</h3>
            <p class="text-sm text-gray-500">Identitas dan informasi ibu kandung.</p>
          </div>
        </div>

        <div class="space-y-4">
          <UFormField label="Nama Ibu">
            <UInput v-model="form.mother" placeholder="Nama lengkap ibu" variant="subtle" class="w-full" />
          </UFormField>

          <div class="grid gap-4 sm:grid-cols-2">
            <UFormField label="NIK">
              <UInput v-model="form.mother_nik" placeholder="NIK" variant="subtle" maxlength="16" inputmode="numeric" class="w-full" />
            </UFormField>
            <UFormField label="No. Telepon">
              <UInput v-model="form.mother_pn" placeholder="Nomor telepon" variant="subtle" maxlength="15" class="w-full" />
            </UFormField>
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <UFormField label="Pekerjaan">
              <UInput v-model="form.mother_job" placeholder="Pekerjaan" variant="subtle" class="w-full" />
            </UFormField>
            <UFormField label="Pendidikan Terakhir">
              <UInput v-model="form.mother_graduate" placeholder="cth: S1, SMA" variant="subtle" class="w-full" />
            </UFormField>
          </div>

          <UFormField label="Penghasilan Per Bulan">
            <USelect v-model="form.mother_income" :items="incomeOptions" variant="subtle" class="w-full" />
          </UFormField>
        </div>
      </div>
    </div>

    <!-- Wali -->
    <div class="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700/50 dark:bg-gray-900">
      <div class="mb-5 flex items-center gap-3">
        <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-50 dark:bg-teal-950">
          <UIcon name="i-lucide-users" class="h-5 w-5 text-teal-600 dark:text-teal-400" />
        </div>
        <div>
          <h3 class="font-semibold text-gray-900 dark:text-gray-100">Data Wali <span class="text-sm font-normal text-gray-400">(opsional)</span></h3>
          <p class="text-sm text-gray-500">Diisi jika wali berbeda dari orang tua kandung.</p>
        </div>
      </div>

      <div class="space-y-4">
        <div class="grid gap-4 sm:grid-cols-2">
          <UFormField label="Nama Wali">
            <UInput v-model="form.guardian" placeholder="Nama lengkap wali" variant="subtle" class="w-full" />
          </UFormField>
          <UFormField label="Hubungan Wali">
            <UInput v-model="form.guardian_relationship" placeholder="cth: Paman, Bibi" variant="subtle" class="w-full" />
          </UFormField>
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
          <UFormField label="NIK">
            <UInput v-model="form.guardian_nik" placeholder="NIK" variant="subtle" maxlength="16" inputmode="numeric" class="w-full" />
          </UFormField>
          <UFormField label="No. Telepon">
            <UInput v-model="form.guardian_pn" placeholder="Nomor telepon" variant="subtle" maxlength="15" class="w-full" />
          </UFormField>
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
          <UFormField label="Pekerjaan">
            <UInput v-model="form.guardian_job" placeholder="Pekerjaan" variant="subtle" class="w-full" />
          </UFormField>
          <UFormField label="Pendidikan Terakhir">
            <UInput v-model="form.guardian_graduate" placeholder="cth: S1, SMA" variant="subtle" class="w-full" />
          </UFormField>
        </div>

        <UFormField label="Penghasilan Per Bulan">
          <USelect v-model="form.guardian_income" :items="incomeOptions" variant="subtle" class="w-full md:w-1/2" />
        </UFormField>
      </div>
    </div>

    <!-- Informasi Tambahan -->
    <div class="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700/50 dark:bg-gray-900">
      <div class="mb-5 flex items-center gap-3">
        <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-50 dark:bg-teal-950">
          <UIcon name="i-lucide-briefcase" class="h-5 w-5 text-teal-600 dark:text-teal-400" />
        </div>
        <div>
          <h3 class="font-semibold text-gray-900 dark:text-gray-100">Informasi Tambahan</h3>
          <p class="text-sm text-gray-500">Pekerjaan atau jurusan calon santri (jika sudah bekerja/sekolah).</p>
        </div>
      </div>

      <div class="space-y-4">
        <div class="grid gap-4 md:grid-cols-3">
          <UFormField label="Pekerjaan / Jurusan">
            <UInput v-model="form.workplace" placeholder="Pekerjaan atau jurusan" variant="subtle" class="w-full" />
          </UFormField>
          <UFormField label="Departemen / Bagian">
            <UInput v-model="form.department" placeholder="Departemen / bagian" variant="subtle" class="w-full" />
          </UFormField>
          <UFormField label="Status Tempat Tinggal">
            <UInput v-model="form.home_status" placeholder="cth: Ikut orang tua, Kost" variant="subtle" class="w-full" />
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
