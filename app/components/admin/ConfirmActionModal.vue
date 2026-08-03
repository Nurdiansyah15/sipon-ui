<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    open: boolean
    title: string
    description?: string
    confirmLabel?: string
    cancelLabel?: string
    color?: 'error' | 'success' | 'primary' | 'neutral'
    loading?: boolean
  }>(),
  {
    description: undefined,
    confirmLabel: 'Konfirmasi',
    cancelLabel: 'Batal',
    color: 'primary',
    loading: false,
  },
)

const emit = defineEmits<{
  'update:open': [boolean]
  confirm: []
}>()

function close() {
  if (props.loading) return
  emit('update:open', false)
}
</script>

<template>
  <UModal
    :open="open"
    :dismissible="!loading"
    @update:open="(v: boolean) => emit('update:open', v)"
  >
    <template #content>
      <div class="p-6">
        <div class="mb-4 flex items-center justify-between">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">{{ title }}</h3>
          <UButton
            color="neutral"
            variant="ghost"
            icon="i-lucide-x"
            size="sm"
            square
            :disabled="loading"
            @click="close"
          />
        </div>

        <p v-if="description" class="mb-4 text-sm text-gray-700 dark:text-gray-300">{{ description }}</p>

        <div class="mb-4">
          <slot />
        </div>

        <div class="flex justify-end gap-2 pt-2">
          <UButton color="neutral" variant="ghost" :disabled="loading" @click="close">
            {{ cancelLabel }}
          </UButton>
          <UButton :color="color" :loading="loading" @click="emit('confirm')">
            {{ confirmLabel }}
          </UButton>
        </div>
      </div>
    </template>
  </UModal>
</template>
