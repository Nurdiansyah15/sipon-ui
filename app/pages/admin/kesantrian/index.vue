<script setup lang="ts">
import { usePermission } from '~/composables/usePermission'

definePageMeta({ layout: 'kesantrian' })

const { can } = usePermission()
</script>

<template>
  <div class="mx-auto max-w-7xl px-4 py-8">
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Kesantrian</h1>
      <p class="mt-1 text-sm text-gray-700 dark:text-gray-300">
        Pusat pengelolaan data santri, dokumen persyaratan, dan permintaan menjadi santri.
      </p>
    </div>

    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <FeatureModuleCard
        v-if="can('manage_santri')"
        title="Kelola Santri"
        description="Daftar santri, buat profil santri baru, import Excel, dan lihat dokumen persyaratan."
        icon="i-lucide-graduation-cap"
        to="/admin/kesantrian/santri"
      />
      <FeatureModuleCard
        v-if="can('manage_santri')"
        title="Permintaan Santri"
        description="Tinjau permintaan menjadi santri, setujui atau tolak permintaan yang masuk."
        icon="i-lucide-clipboard-check"
        to="/admin/kesantrian/requests"
      />
    </div>
  </div>
</template>
