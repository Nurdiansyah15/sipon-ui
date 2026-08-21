<script setup lang="ts">
useHead({
  titleTemplate: (title) => (title ? `${title} · Sipon` : 'Sipon'),
  link: [
    { rel: 'icon', type: 'image/png', href: '/logo.png' },
  ],
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
