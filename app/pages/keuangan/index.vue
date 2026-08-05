<script setup lang="ts">
definePageMeta({ layout: 'default' })

navigateTo('/keuangan/tagihan', { replace: true })
</script>

<template>
  <div class="mx-auto max-w-7xl px-4 py-8">
    <USkeleton class="h-32 w-full" />
  </div>
</template>
