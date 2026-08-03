<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import { useKesantrianStore } from '~/stores/kesantrian'

const props = defineProps<{
  open: boolean
  requestId: string
  requestName: string
}>()

const emit = defineEmits<{
  'update:open': [boolean]
  approved: []
}>()

const store = useKesantrianStore()
const toast = useToast()

const schema = z.object({
  nis: z
    .string()
    .regex(/^1000[12][0-9]{5}$/, 'Format NIS tidak valid (mis. 1000112345)'),
})
type Schema = z.output<typeof schema>

const state = reactive<Partial<Schema>>({ nis: '' })
const isSubmitting = ref(false)

function resetState() {
  state.nis = ''
}

function close() {
  resetState()
  emit('update:open', false)
}

watch(
  () => props.open,
  (open) => {
    if (open) resetState()
  },
)

async function onSubmit(event: FormSubmitEvent<Schema>) {
  isSubmitting.value = true
  try {
    await store.approveSantriRequest(props.requestId, { nis: event.data.nis })
    toast.add({ title: 'Permintaan santri disetujui', color: 'success' })
    emit('approved')
    close()
  } catch (err) {
    toast.add({
      title: 'Gagal menyetujui permintaan',
      description: store.error ?? undefined,
      color: 'error',
    })
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <UModal :open="open" @update:open="(v: boolean) => emit('update:open', v)">
    <template #content>
      <div class="p-6">
        <div class="mb-4 flex items-center justify-between">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Setujui Permintaan Santri</h3>
          <UButton color="neutral" variant="ghost" icon="i-lucide-x" size="sm" square @click="close" />
        </div>

        <p class="mb-4 text-sm text-gray-700 dark:text-gray-300">
          Menyetujui permintaan dari <strong>{{ requestName }}</strong>. Masukkan NIS untuk membuat profil santri.
        </p>

        <UForm :schema="schema" :state="state" class="space-y-4" @submit="onSubmit">
          <UFormField label="NIS" name="nis" required description="Nomor Induk Santri, 10 digit (mis. 1000112345)">
            <UInput v-model="state.nis" class="w-full" variant="subtle" placeholder="1000112345" />
          </UFormField>

          <div class="flex justify-end gap-2 pt-2">
            <UButton color="neutral" variant="ghost" type="button" @click="close">Batal</UButton>
            <UButton type="submit" color="success" :loading="isSubmitting" icon="i-lucide-check">Setujui</UButton>
          </div>
        </UForm>
      </div>
    </template>
  </UModal>
</template>
