<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'

definePageMeta({ layout: 'default' })

const authStore = useAuthStore()

const displayName = computed(() => authStore.user?.fullname || authStore.user?.username || '')
</script>

<template>
  <div>
    <HeroBanner />
    <div class="mx-auto max-w-7xl px-4 py-6">
      <h2 class="text-lg font-semibold text-gray-900">Selamat datang, {{ displayName }}!</h2>
    </div>
    <FeatureModuleGrid />
  </div>
</template>
