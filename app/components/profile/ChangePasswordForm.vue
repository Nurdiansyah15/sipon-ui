<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import { useAuthStore } from '~/stores/auth'
import { parsePasswordError } from '~/utils/errorParser'

const authStore = useAuthStore()
const toast = useToast()

const schema = z
  .object({
    currentPassword: z.string().min(1, 'Wajib diisi'),
    newPassword: z
      .string()
      .min(8, 'Minimal 8 karakter')
      .regex(/[A-Z]/, 'Wajib mengandung minimal 1 huruf kapital')
      .regex(/[0-9]/, 'Wajib mengandung minimal 1 angka'),
    confirmPassword: z.string().min(1, 'Wajib diisi'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Konfirmasi kata sandi tidak cocok',
    path: ['confirmPassword'],
  })
type Schema = z.output<typeof schema>

const state = reactive<Partial<Schema>>({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
})

const isSubmitting = ref(false)

async function onSubmit(event: FormSubmitEvent<Schema>) {
  isSubmitting.value = true
  try {
    await authStore.changePassword({
      current_password: event.data.currentPassword,
      new_password: event.data.newPassword,
    })
    state.currentPassword = ''
    state.newPassword = ''
    state.confirmPassword = ''
    toast.add({
      title: 'Kata sandi berhasil diubah',
      color: 'success',
    })
  } catch (err) {
    toast.add({
      title: 'Gagal mengubah kata sandi',
      description: parsePasswordError(err),
      color: 'error',
    })
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="max-w-4xl">
    <h3 class="text-sm font-semibold text-gray-900">Ubah Kata Sandi</h3>
    <p class="mt-1 text-sm text-gray-500">
      Masukkan kata sandi saat ini untuk mengonfirmasi perubahan.
    </p>

    <UForm :schema="schema" :state="state" class="mt-4" @submit="onSubmit">
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <UFormField label="Kata Sandi Saat Ini" name="currentPassword">
          <UInput v-model="state.currentPassword" type="password" class="w-full" autocomplete="current-password" size="lg" />
        </UFormField>

        <UFormField label="Kata Sandi Baru" name="newPassword">
          <UInput v-model="state.newPassword" type="password" class="w-full" autocomplete="new-password" size="lg" />
        </UFormField>

        <UFormField label="Konfirmasi Kata Sandi Baru" name="confirmPassword">
          <UInput v-model="state.confirmPassword" type="password" class="w-full" autocomplete="new-password" size="lg" />
        </UFormField>
      </div>

      <UButton type="submit" :loading="isSubmitting" class="mt-4">
        Ubah Kata Sandi
      </UButton>
    </UForm>
  </div>
</template>
