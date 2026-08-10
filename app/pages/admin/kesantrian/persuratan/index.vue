<script setup lang="ts">
import { usePermission } from '~/composables/usePermission'

definePageMeta({ layout: 'kesantrian' })

const { can } = usePermission()
</script>

<template>
  <div class="mx-auto max-w-7xl px-4 py-8">
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Persuratan</h1>
      <p class="mt-1 text-sm text-gray-700 dark:text-gray-300">
        Kelola master tipe surat dan pencatatan surat keluar dengan nomor otomatis.
      </p>
    </div>

    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <FeatureModuleCard
        v-if="can('manage_persuratan')"
        title="Tipe Surat"
        description="Kelola master jenis surat beserta kode yang dipakai dalam penomoran surat."
        icon="i-lucide-tags"
        to="/admin/kesantrian/persuratan/tipe-surat"
      />
      <FeatureModuleCard
        v-if="can('manage_persuratan')"
        title="Surat"
        description="Catat surat keluar, tautkan dokumen aset, dan lihat nomor surat otomatis."
        icon="i-lucide-mail"
        to="/admin/kesantrian/persuratan/surat"
      />
    </div>
  </div>
</template>
