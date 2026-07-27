<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import { useUserManagementStore } from '~/stores/userManagement'

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  'update:open': [boolean]
  created: []
}>()

const store = useUserManagementStore()
const toast = useToast()

const schema = z.object({
  username: z
    .string()
    .min(3, 'Minimal 3 karakter')
    .max(30, 'Maksimal 30 karakter')
    .regex(/^[a-zA-Z0-9_]+$/, 'Hanya huruf, angka, dan underscore'),
  email: z.string().email('Email tidak valid'),
  fullname: z.string().optional(),
  phone: z.string().optional(),
})
type Schema = z.output<typeof schema>

const state = reactive<Partial<Schema>>({
  username: '',
  email: '',
  fullname: '',
  phone: '',
})

// Tahap: 'form' | 'password-reveal'
const stage = ref<'form' | 'password-reveal'>('form')
const generatedPassword = ref('')
const isSubmitting = ref(false)

function resetState() {
  state.username = ''
  state.email = ''
  state.fullname = ''
  state.phone = ''
  stage.value = 'form'
  generatedPassword.value = ''
}

function close() {
  resetState()
  emit('update:open', false)
  store.clearOneTimePassword()
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
    const res = await store.createUser({
      username: event.data.username,
      email: event.data.email,
      fullname: event.data.fullname || undefined,
      phone: event.data.phone || undefined,
    })
    generatedPassword.value = res.generated_password
    stage.value = 'password-reveal'
    toast.add({ title: 'User berhasil dibuat', color: 'success' })
    emit('created')
  } catch (err) {
    toast.add({
      title: 'Gagal membuat user',
      description: store.error ?? undefined,
      color: 'error',
    })
  } finally {
    isSubmitting.value = false
  }
}

function onPasswordConfirmed() {
  close()
}
</script>

<template>
  <UModal
    :open="open"
    :dismissible="stage === 'form'"
    @update:open="(v: boolean) => emit('update:open', v)"
  >
    <template #content>
      <div class="p-6">
        <div class="mb-4 flex items-center justify-between">
          <h3 class="text-lg font-semibold text-gray-900">Buat User Baru</h3>
          <UButton
            v-if="stage === 'form'"
            color="neutral"
            variant="ghost"
            icon="i-lucide-x"
            size="sm"
            square
            @click="close"
          />
        </div>

        <!-- Tahap 1: form input -->
        <UForm
          v-if="stage === 'form'"
          :schema="schema"
          :state="state"
          class="space-y-4"
          @submit="onSubmit"
        >
          <UFormField label="Username" name="username" required>
            <UInput v-model="state.username" class="w-full" variant="subtle" placeholder="tamu_01" />
          </UFormField>

          <UFormField label="Email" name="email" required>
            <UInput v-model="state.email" type="email" class="w-full" variant="subtle" placeholder="tamu@example.com" />
          </UFormField>

          <UFormField label="Nama Lengkap" name="fullname">
            <UInput v-model="state.fullname" class="w-full" variant="subtle" placeholder="Tamu Husain" />
          </UFormField>

          <UFormField label="Nomor Telepon" name="phone">
            <UInput v-model="state.phone" class="w-full" variant="subtle" placeholder="+628123456789" />
          </UFormField>

          <div class="flex justify-end gap-2 pt-2">
            <UButton color="neutral" variant="ghost" type="button" @click="close">Batal</UButton>
            <UButton type="submit" :loading="isSubmitting" icon="i-lucide-plus">Buat User</UButton>
          </div>
        </UForm>

        <!-- Tahap 2: reveal generated password -->
        <div v-else class="space-y-4">
          <SystemAdminOneTimePasswordReveal
            :password="generatedPassword"
            title="Kata Sandi Sementara User"
            @confirmed="onPasswordConfirmed"
          />
        </div>
      </div>
    </template>
  </UModal>
</template>