<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    open: boolean
    title: string
    message: string
    confirmLabel?: string
    confirmColor?: 'primary' | 'error' | 'warning' | 'success'
    loading?: boolean
  }>(),
  {
    confirmLabel: 'Konfirmasi',
    confirmColor: 'primary',
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
  <UModal :open="open" :dismissible="!loading" @update:open="(v: boolean) => emit('update:open', v)">
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

        <p class="mb-4 text-sm text-gray-700 dark:text-gray-300">{{ message }}</p>

        <div class="flex justify-end gap-2 pt-2">
          <UButton color="neutral" variant="ghost" :disabled="loading" @click="close">
            Batal
          </UButton>
          <UButton :color="confirmColor" :loading="loading" @click="emit('confirm')">
            {{ confirmLabel }}
          </UButton>
        </div>
      </div>
    </template>
  </UModal>
</template>
