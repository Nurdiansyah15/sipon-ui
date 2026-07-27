<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router'

withDefaults(
  defineProps<{
    title: string
    description: string
    icon: string
    to?: RouteLocationRaw
  }>(),
  { to: undefined },
)
</script>

<template>
  <NuxtLink
    v-if="to"
    :to="to"
    class="flex cursor-pointer items-center gap-4 rounded-lg border border-gray-200 bg-white p-4 transition hover:shadow-md"
  >
    <div class="flex-1">
      <h3 class="font-semibold text-gray-900">{{ title }}</h3>
      <p class="mt-1 line-clamp-2 text-sm text-gray-500">{{ description }}</p>
    </div>
    <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-teal-50">
      <UIcon :name="icon" class="h-6 w-6 text-teal-600" />
    </div>
  </NuxtLink>

  <div
    v-else
    class="flex cursor-pointer items-center gap-4 rounded-lg border border-gray-200 bg-white p-4 transition hover:shadow-md"
  >
    <div class="flex-1">
      <h3 class="font-semibold text-gray-900">{{ title }}</h3>
      <p class="mt-1 line-clamp-2 text-sm text-gray-500">{{ description }}</p>
    </div>
    <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-teal-50">
      <UIcon :name="icon" class="h-6 w-6 text-teal-600" />
    </div>
  </div>
</template>