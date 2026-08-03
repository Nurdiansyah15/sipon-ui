<script setup lang="ts">
import { usePermission } from '~/composables/usePermission'

definePageMeta({ layout: 'psb' })

const { can } = usePermission()
</script>

<template>
  <div class="mx-auto max-w-7xl px-4 py-8">
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">PSB — Penerimaan Santri Baru</h1>
      <p class="mt-1 text-sm text-gray-700 dark:text-gray-300">
        Pusat pengelolaan pendaftaran santri baru: review pendaftar, verifikasi dokumen, generate NIS, dan atur periode.
      </p>
    </div>

    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <FeatureModuleCard
        v-if="can('manage_psb')"
        title="Kelola Pendaftar"
        description="Review pendaftaran, verifikasi dokumen, accept/reject, dan generate NIS."
        icon="i-lucide-users"
        to="/admin/psb/pendaftaran"
      />
      <FeatureModuleCard
        v-if="can('manage_psb_settings')"
        title="Setting PSB"
        description="Kelola periode pendaftaran, kuota, biaya, dan rekening bank."
        icon="i-lucide-calendar-range"
        to="/admin/psb/settings"
      />
    </div>
  </div>
</template>
