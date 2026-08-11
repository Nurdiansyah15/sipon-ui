<script setup lang="ts">
useHead({
  titleTemplate: (title) => (title ? `${title} · Sipon` : 'Sipon'),
})
</script>

<template>
    <UApp>
    <NuxtLoadingIndicator />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
