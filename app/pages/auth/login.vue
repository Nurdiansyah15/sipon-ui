<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import { useAuthStore } from '~/stores/auth'

definePageMeta({ layout: 'auth' })

const authStore = useAuthStore()
const route = useRoute()
const toast = useToast()

const schema = z.object({
  identifier: z.string().min(1, 'Wajib diisi'),
  password: z.string().min(1, 'Wajib diisi'),
})
type Schema = z.output<typeof schema>

const state = reactive<Partial<Schema>>({
  identifier: '',
  password: '',
})

const isSubmitting = ref(false)

async function onSubmit(event: FormSubmitEvent<Schema>) {
  isSubmitting.value = true
  try {
    await authStore.login(event.data)
    const redirect = (route.query.redirect as string) || '/dashboard'
    await navigateTo(redirect)
  } catch {
    toast.add({
      title: 'Gagal masuk',
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
      <h2 class="text-base font-semibold">Masuk ke akun Anda</h2>
    </template>

    <UForm :schema="schema" :state="state" class="space-y-4" @submit="onSubmit">
      <UFormField label="Email, username, atau nomor HP" name="identifier">
        <UInput v-model="state.identifier" class="w-full" placeholder="you@example.com" autocomplete="username" />
      </UFormField>

      <UFormField label="Kata sandi" name="password">
        <UInput v-model="state.password" type="password" class="w-full" autocomplete="current-password" />
      </UFormField>

      <UButton type="submit" block :loading="isSubmitting">
        Masuk
      </UButton>
    </UForm>

    <template #footer>
      <p class="text-center text-sm text-muted">
        Belum punya akun?
        <ULink to="/auth/register" class="font-medium text-primary">Daftar</ULink>
      </p>
    </template>
  </UCard>
</template>
