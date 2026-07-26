<script setup lang="ts">
// Global auth middleware redirects '/' to either /dashboard or /auth/login.
// This placeholder only renders for the brief moment before that redirect resolves.
</script>

<template>
  <div class="flex min-h-screen items-center justify-center">
    <UIcon name="i-lucide-loader-circle" class="size-6 animate-spin text-muted" />
  </div>
</template>
