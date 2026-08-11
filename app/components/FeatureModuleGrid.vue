<script setup lang="ts">
import { useAppModules } from '~/composables/useAppModules'

const { publicApps, visibleAdminApps } = useAppModules()

const portalAdminApps = computed(() => visibleAdminApps.value.filter((app) => app.to === '/admin'))
</script>

<template>
  <section class="mx-auto max-w-7xl">
    <!-- Aplikasi Publik -->
    <div class="mb-8">
      <h2 class="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
        Aplikasi Publik
      </h2>
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <FeatureModuleCard
          v-for="app in publicApps"
          :key="app.to"
          :title="app.title"
          :description="app.description"
          :icon="app.icon"
          :to="app.to"
        />
      </div>
    </div>

    <!-- Aplikasi Admin (hanya Portal Admin yang tampil) -->
    <div v-if="portalAdminApps.length > 0">
      <h2 class="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
        Aplikasi Admin
      </h2>
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <FeatureModuleCard
          v-for="app in portalAdminApps"
          :key="app.to"
          :title="app.title"
          :description="app.description"
          :icon="app.icon"
          :to="app.to"
        />
      </div>
    </div>
  </section>
</template>
