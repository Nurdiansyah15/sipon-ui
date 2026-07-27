<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'

defineProps<{
  items: DropdownMenuItem[]
}>()
</script>

<template>
  <UDropdownMenu :items="items" :content="{ align: 'end', side: 'bottom' }">
    <UButton
      variant="ghost"
      icon="i-lucide-ellipsis-vertical"
      size="sm"
      square
      class="text-gray-700"
    />
  </UDropdownMenu>
</template>