<script setup lang="ts">
const props = defineProps<{
  open: boolean
  password: string
}>()

const emit = defineEmits<{
  'update:open': [boolean]
}>()

function close() {
  emit('update:open', false)
}
</script>

<template>
  <UModal
    :open="open"
    :dismissible="false"
    @update:open="(v: boolean) => emit('update:open', v)"
  >
    <template #content>
      <div class="p-6">
        <div class="mb-4 flex items-center gap-2">
          <UIcon name="i-lucide-key-round" class="h-5 w-5 text-warning" />
          <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Setel Ulang Kata Sandi</h3>
        </div>
        <SystemAdminOneTimePasswordReveal
          :password="password"
          title="Kata Sandi Baru User"
          @confirmed="close"
        />
      </div>
    </template>
  </UModal>
</template>