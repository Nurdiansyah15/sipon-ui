<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps<{
  error: NuxtError
}>()

function handleClear() {
  clearError({ redirect: '/' })
}
</script>

<template>
  <UApp>
    <div class="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <p class="text-4xl font-bold">{{ props.error.statusCode }}</p>
      <p class="text-muted">{{ props.error.statusMessage || 'Terjadi kesalahan.' }}</p>
      <UButton label="Kembali ke beranda" @click="handleClear" />
    </div>
  </UApp>
</template>
