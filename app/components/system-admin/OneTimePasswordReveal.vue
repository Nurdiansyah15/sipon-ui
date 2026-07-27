<script setup lang="ts">
import { useClipboard } from '@vueuse/core'

const props = defineProps<{
  password: string
  title?: string
  description?: string
}>()

const emit = defineEmits<{
  confirmed: []
}>()

const { copy, copied, isSupported } = useClipboard()

const titleText = computed(() => props.title || 'Kata Sandi Sementara')
const descriptionText = computed(
  () =>
    props.description ||
    'Salin kata sandi ini dan berikan kepada user. Demi keamanan, kata sandi tidak akan ditampilkan lagi.',
)

function copyPassword() {
  if (isSupported.value) {
    copy(props.password)
  } else {
    // Fallback: pilih teks secara manual
    if (import.meta.client && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(props.password)
    }
  }
}

function confirm() {
  emit('confirmed')
}
</script>

<template>
  <div class="space-y-4">
    <UAlert
      icon="i-lucide-triangle-alert"
      color="warning"
      variant="subtle"
      :title="titleText"
      :description="descriptionText"
    />

    <div class="flex items-center gap-2 rounded-lg border-2 border-dashed border-warning bg-warning-50 p-3">
      <code class="flex-1 break-all font-mono text-lg font-semibold text-gray-900">{{ password }}</code>
      <UButton
        :icon="copied ? 'i-lucide-check' : 'i-lucide-copy'"
        :color="copied ? 'success' : 'neutral'"
        variant="outline"
        size="sm"
        @click="copyPassword"
      >
        {{ copied ? 'Tersalin' : 'Salin' }}
      </UButton>
    </div>

    <UButton block size="lg" color="neutral" icon="i-lucide-check" @click="confirm">
      Saya sudah menyalin, tutup
    </UButton>
  </div>
</template>