<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import { useAuthStore } from '~/stores/auth'
import { useUserSettingsStore } from '~/stores/userSettings'
import { parsePasswordError } from '~/utils/errorParser'

const authStore = useAuthStore()
const userSettingsStore = useUserSettingsStore()
const toast = useToast()

const schema = z
  .object({
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
  newPassword: '',
  confirmPassword: '',
})

const isSubmitting = ref(false)

async function onSubmit(event: FormSubmitEvent<Schema>) {
  isSubmitting.value = true
  try {
    await authStore.setPassword({ new_password: event.data.newPassword })
    state.newPassword = ''
    state.confirmPassword = ''
    // Setelah password aktif, can_unlink untuk akun Google berubah jadi true —
    // refresh agar tab "Akun Tertaut" tidak menampilkan data basi.
    await userSettingsStore.fetchLinkedAccounts(true)
    toast.add({
      title: 'Kata sandi berhasil diatur',
      color: 'success',
    })
  } catch (err) {
    toast.add({
      title: 'Gagal mengatur kata sandi',
      description: parsePasswordError(err),
      color: 'error',
    })
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="max-w-md">
    <h3 class="text-sm font-semibold text-gray-900 dark:text-gray-100">Atur Kata Sandi</h3>
    <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
      Akun Anda belum memiliki kata sandi. Atur kata sandi untuk bisa masuk menggunakan
      email/username — ini juga diperlukan sebelum bisa melepas akun Google dari
      tab "Akun Tertaut".
    </p>

    <UForm :schema="schema" :state="state" class="mt-4 space-y-4" @submit="onSubmit">
      <UFormField label="Kata Sandi Baru" name="newPassword">
        <UInput v-model="state.newPassword" type="password" class="w-full" autocomplete="new-password" size="lg" />
      </UFormField>

      <UFormField label="Konfirmasi Kata Sandi Baru" name="confirmPassword">
        <UInput v-model="state.confirmPassword" type="password" class="w-full" autocomplete="new-password" size="lg" />
      </UFormField>

      <UButton type="submit" :loading="isSubmitting">
        Atur Kata Sandi
      </UButton>
    </UForm>
  </div>
</template>
