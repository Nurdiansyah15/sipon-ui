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
          <UIcon name="i-lucide-id-card" class="h-5 w-5 text-teal-600 dark:text-teal-400" />
        </div>
        <div>
          <h3 class="font-semibold text-gray-900 dark:text-gray-100">Data Kependudukan</h3>
          <p class="text-sm text-gray-500">Identitas kependudukan calon santri.</p>
        </div>
      </div>

      <div class="grid gap-4 md:grid-cols-3">
        <UFormField label="NIK" hint="16 digit">
          <UInput v-model="form.nik" placeholder="Nomor Induk Kependudukan" variant="subtle" maxlength="16" inputmode="numeric" class="w-full" />
        </UFormField>

        <UFormField label="No. KK" hint="16 digit">
          <UInput v-model="form.no_kk" placeholder="Nomor Kartu Keluarga" variant="subtle" maxlength="16" inputmode="numeric" class="w-full" />
        </UFormField>

        <UFormField label="NISN" hint="10 digit">
          <UInput v-model="form.nisn" placeholder="Nomor Induk Siswa Nasional" variant="subtle" maxlength="10" inputmode="numeric" class="w-full" />
        </UFormField>
      </div>
    </div>

    <div class="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700/50 dark:bg-gray-900">
      <div class="mb-5 flex items-center gap-3">
        <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-50 dark:bg-teal-950">
          <UIcon name="i-lucide-hand-heart" class="h-5 w-5 text-teal-600 dark:text-teal-400" />
        </div>
        <div>
          <h3 class="font-semibold text-gray-900 dark:text-gray-100">Bantuan Sosial</h3>
          <p class="text-sm text-gray-500">Opsional — diisi jika calon santri penerima bantuan pemerintah.</p>
        </div>
      </div>

      <div class="grid gap-4 md:grid-cols-3">
        <UFormField label="No. KIP">
          <UInput v-model="form.no_kip" placeholder="Kartu Indonesia Pintar" variant="subtle" maxlength="20" class="w-full" />
        </UFormField>

        <UFormField label="No. KKS">
          <UInput v-model="form.no_kks" placeholder="Kartu Keluarga Sejahtera" variant="subtle" maxlength="20" class="w-full" />
        </UFormField>

        <UFormField label="No. PKH">
          <UInput v-model="form.no_pkh" placeholder="Program Keluarga Harapan" variant="subtle" maxlength="20" class="w-full" />
        </UFormField>
      </div>
    </div>

    <div class="flex justify-between">
      <UButton color="neutral" variant="ghost" leading-icon="i-lucide-arrow-left" @click="emit('prev')">Kembali</UButton>
      <UButton trailing-icon="i-lucide-arrow-right" @click="emit('next')">Lanjut</UButton>
    </div>

  </div>
</template>
