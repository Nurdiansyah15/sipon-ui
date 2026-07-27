<script setup lang="ts">
useHead({
  titleTemplate: (title) => (title ? `${title} · Sipon` : 'Sipon'),
})
</script>

<template>
  <UApp>
    <UColorModeScript />
    <NuxtLoadingIndicator />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
