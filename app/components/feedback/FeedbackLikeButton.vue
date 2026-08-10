<script setup lang="ts">
import { useFeedbackStore } from '~/stores/feedback'
import { parseApiError } from '~/utils/errorParser'

const props = defineProps<{
  feedbackId: string
  liked: boolean
  count: number
}>()

const emit = defineEmits<{
  updated: [liked: boolean, count: number]
}>()

const store = useFeedbackStore()
const toast = useToast()

const isLiking = ref(false)

async function toggle() {
  if (isLiking.value) return
  isLiking.value = true
  try {
    const res = await store.toggleLikeFeedback(props.feedbackId)
    emit('updated', res.liked, res.like_count)
  } catch (err) {
    toast.add({ title: 'Gagal mengubah like', description: parseApiError(err), color: 'error' })
  } finally {
    isLiking.value = false
  }
}
</script>

<template>
  <UButton
    icon="i-lucide-thumbs-up"
    :color="props.liked ? 'primary' : 'neutral'"
    :variant="props.liked ? 'soft' : 'ghost'"
    size="xs"
    :loading="isLiking"
    class="gap-1.5"
    @click="toggle"
  >
    <span class="tabular-nums">{{ props.count }}</span>
  </UButton>
</template>
