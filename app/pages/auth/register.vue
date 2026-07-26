<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import { useAuthStore } from '~/stores/auth'

definePageMeta({ layout: 'auth' })

const authStore = useAuthStore()
const toast = useToast()

const schema = z
  .object({
    username: z.string().min(3, 'Minimal 3 karakter').max(30, 'Maksimal 30 karakter'),
    email: z.string().email('Email tidak valid'),
    password: z.string().min(8, 'Minimal 8 karakter'),
    confirmPassword: z.string().min(1, 'Wajib diisi'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Konfirmasi kata sandi tidak cocok',
    path: ['confirmPassword'],
  })
type Schema = z.output<typeof schema>

const state = reactive<Partial<Schema>>({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
})

const isSubmitting = ref(false)

async function onSubmit(event: FormSubmitEvent<Schema>) {
  isSubmitting.value = true
  try {
    await authStore.register({
      username: event.data.username,
      email: event.data.email,
      password: event.data.password,
    })
    await navigateTo('/dashboard')
  } catch {
    toast.add({
      title: 'Gagal mendaftar',
      description: authStore.error ?? undefined,
      color: 'error',
    })
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <UCard>
    <template #header>
      <h2 class="text-base font-semibold">Buat akun baru</h2>
    </template>

    <UForm :schema="schema" :state="state" class="space-y-4" @submit="onSubmit">
      <UFormField label="Username" name="username">
        <UInput v-model="state.username" class="w-full" autocomplete="username" />
      </UFormField>

      <UFormField label="Email" name="email">
        <UInput v-model="state.email" type="email" class="w-full" autocomplete="email" />
      </UFormField>

      <UFormField label="Kata sandi" name="password">
        <UInput v-model="state.password" type="password" class="w-full" autocomplete="new-password" />
      </UFormField>

      <UFormField label="Konfirmasi kata sandi" name="confirmPassword">
        <UInput v-model="state.confirmPassword" type="password" class="w-full" autocomplete="new-password" />
      </UFormField>

      <UButton type="submit" block :loading="isSubmitting">
        Daftar
      </UButton>
    </UForm>

    <template #footer>
      <p class="text-center text-sm text-muted">
        Sudah punya akun?
        <ULink to="/auth/login" class="font-medium text-primary">Masuk</ULink>
      </p>
    </template>
  </UCard>
</template>
