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
          <UIcon name="i-lucide-briefcase" class="h-5 w-5 text-teal-600 dark:text-teal-400" />
        </div>
        <div>
          <h3 class="font-semibold text-gray-900 dark:text-gray-100">Informasi Tambahan</h3>
          <p class="text-sm text-gray-500">Pekerjaan, instansi, dan status tempat tinggal calon santri.</p>
        </div>
      </div>

      <div class="space-y-4">
        <div class="grid gap-4 md:grid-cols-3">
          <UFormField label="Pekerjaan / Instansi">
            <UInput v-model="form.workplace" placeholder="Pekerjaan atau instansi" variant="subtle" class="w-full" />
          </UFormField>
          <UFormField label="Jurusan / Bagian">
            <UInput v-model="form.department" placeholder="Jurusan / bagian" variant="subtle" class="w-full" />
          </UFormField>
          <UFormField label="Status Tempat Tinggal">
            <UInput v-model="form.home_status" placeholder="cth: Ikut orang tua, Kost, Asrama" variant="subtle" class="w-full" />
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
