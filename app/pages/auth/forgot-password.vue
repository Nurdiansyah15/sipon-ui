<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import { useAuthStore } from '~/stores/auth'
import { parseApiError } from '~/utils/errorParser'

definePageMeta({ layout: 'auth' })

const authStore = useAuthStore()
const toast = useToast()

const step = ref<'email' | 'reset'>('email')
const isSubmitting = ref(false)
const emailValue = ref('')

// ── Step 1: Email ──────────────────────────────────────────────────────────
const emailSchema = z.object({
  email: z.string().email('Email tidak valid'),
})
type EmailSchema = z.output<typeof emailSchema>

const emailState = reactive<Partial<EmailSchema>>({ email: '' })

async function requestReset(event: FormSubmitEvent<EmailSchema>) {
  isSubmitting.value = true
  try {
    await authStore.forgotPassword(event.data.email)
    emailValue.value = event.data.email
    step.value = 'reset'
    toast.add({
      title: 'Kode reset terkirim',
      description: 'Silakan cek email Anda untuk kode OTP.',
      color: 'success',
    })
  } catch (err) {
    toast.add({
      title: 'Gagal mengirim kode reset',
      description: parseApiError(err, 'Terjadi kesalahan'),
      color: 'error',
    })
  } finally {
    isSubmitting.value = false
  }
}

// ── Step 2: Reset ──────────────────────────────────────────────────────────
const resetSchema = z
  .object({
    otp: z.string().length(6, 'OTP harus 6 digit').regex(/^\d+$/, 'OTP harus angka'),
    password: z
      .string()
      .min(8, 'Minimal 8 karakter')
      .regex(/[A-Z]/, 'Wajib mengandung minimal 1 huruf kapital')
      .regex(/[0-9]/, 'Wajib mengandung minimal 1 angka'),
    confirmPassword: z.string().min(1, 'Wajib diisi'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Konfirmasi kata sandi tidak cocok',
    path: ['confirmPassword'],
  })
type ResetSchema = z.output<typeof resetSchema>

const resetState = reactive<Partial<ResetSchema>>({
  otp: '',
  password: '',
  confirmPassword: '',
})

async function resetPassword(event: FormSubmitEvent<ResetSchema>) {
  isSubmitting.value = true
  try {
    await authStore.resetPassword(emailValue.value, event.data.otp, event.data.password)
    toast.add({
      title: 'Password berhasil direset',
      description: 'Silakan login dengan password baru Anda.',
      color: 'success',
    })
    await navigateTo('/auth/login')
  } catch (err) {
    toast.add({
      title: 'Gagal mereset password',
      description: parseApiError(err, 'Terjadi kesalahan'),
      color: 'error',
    })
  } finally {
    isSubmitting.value = false
  }
}

function backToEmail() {
  step.value = 'email'
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-[#0b857a] p-0 md:p-12">
    <div class="relative flex w-full max-w-4xl min-h-screen flex-col rounded-none bg-white shadow-2xl md:min-h-0 md:flex-row md:rounded-2xl dark:bg-gray-900">
      <button
        class="absolute left-4 top-4 z-20 flex h-8 w-8 items-center justify-center rounded-full text-white/80 transition hover:bg-white/10 hover:text-white"
        @click="navigateTo('/')"
      >
        <UIcon name="i-lucide-x" class="h-5 w-5" />
      </button>

      <div
        class="absolute top-12 z-10 hidden h-16 w-16 -translate-x-1/2 items-center justify-center rounded-full bg-white shadow-lg md:flex dark:bg-gray-800"
        :style="{ left: '45%' }"
      >
        <UIcon name="i-lucide-key-round" class="h-8 w-8 text-teal-600" />
      </div>

      <!-- Left Panel -->
      <div class="hidden w-[45%] flex-col overflow-hidden rounded-l-2xl bg-teal-600 md:flex">
        <div class="flex flex-1 flex-col items-center justify-center px-8 py-12">
          <div class="flex flex-col items-center">
            <div class="relative flex h-48 w-48 items-center justify-center">
              <UIcon name="i-lucide-lock" class="h-24 w-24 text-white/70" />
              <div class="absolute -left-4 top-2 flex h-12 w-16 items-center justify-center rounded-lg bg-white/15 backdrop-blur-sm">
                <UIcon name="i-lucide-mail" class="h-7 w-7 text-white/80" />
              </div>
              <div class="absolute -right-4 top-2 flex h-12 w-14 items-center justify-center rounded-lg bg-white/15 backdrop-blur-sm">
                <UIcon name="i-lucide-shield-check" class="h-7 w-7 text-white/80" />
              </div>
              <div class="absolute -bottom-2 left-1/2 flex h-12 w-12 -translate-x-1/2 items-center justify-center rounded-lg bg-white/15 backdrop-blur-sm">
                <UIcon name="i-lucide-key" class="h-7 w-7 text-white/80" />
              </div>
            </div>
          </div>

          <h2 class="mt-10 text-2xl font-bold text-white">Lupa Password?</h2>
          <p class="mt-2 text-center text-sm leading-relaxed text-white/60">
            Jangan khawatir, masukkan email Anda dan kami akan mengirimkan kode untuk mereset password.
          </p>
        </div>
      </div>

      <!-- Right Panel -->
      <div class="flex w-full flex-1 flex-col justify-center overflow-hidden rounded-none p-8 md:w-[55%] md:flex-none md:rounded-r-2xl md:p-12">
        <div class="mb-6 flex justify-center md:hidden">
          <div class="flex h-16 w-16 items-center justify-center rounded-full bg-teal-600 shadow-lg">
            <UIcon name="i-lucide-key-round" class="h-8 w-8 text-white" />
          </div>
        </div>

        <!-- Step 1: Enter Email -->
        <template v-if="step === 'email'">
          <h1 class="text-center text-2xl font-bold text-gray-900 dark:text-gray-100">Lupa Password</h1>
          <p class="mt-1 text-center text-sm text-gray-500 dark:text-gray-400">
            Masukkan email Anda, kami akan mengirimkan kode reset.
          </p>

          <UForm :schema="emailSchema" :state="emailState" class="mt-6 space-y-4" @submit="requestReset">
            <UFormField label="Email" name="email">
              <UInput
                v-model="emailState.email"
                type="email"
                class="w-full"
                placeholder="you@example.com"
                autocomplete="email"
                size="lg"
              />
            </UFormField>

            <UButton type="submit" block :loading="isSubmitting" size="lg">
              Kirim Kode Reset
            </UButton>
          </UForm>
        </template>

        <!-- Step 2: Enter OTP + New Password -->
        <template v-else>
          <h1 class="text-center text-2xl font-bold text-gray-900 dark:text-gray-100">Reset Password</h1>
          <p class="mt-1 text-center text-sm text-gray-500 dark:text-gray-400">
            Kode reset telah dikirim ke <span class="font-medium text-gray-900 dark:text-gray-100">{{ emailValue }}</span>
          </p>

          <UForm :schema="resetSchema" :state="resetState" class="mt-6 space-y-4" @submit="resetPassword">
            <UFormField label="Kode OTP" name="otp">
              <UInput
                v-model="resetState.otp"
                class="w-full text-center tracking-[.5em]"
                placeholder="000000"
                maxlength="6"
                size="lg"
                autofocus
              />
            </UFormField>

            <UFormField label="Password Baru" name="password">
              <UInput
                v-model="resetState.password"
                type="password"
                class="w-full"
                autocomplete="new-password"
                size="lg"
              />
            </UFormField>

            <UFormField label="Konfirmasi Password Baru" name="confirmPassword">
              <UInput
                v-model="resetState.confirmPassword"
                type="password"
                class="w-full"
                autocomplete="new-password"
                size="lg"
              />
            </UFormField>

            <div class="flex items-center justify-between">
              <UButton type="button" variant="link" size="sm" :disabled="isSubmitting" @click="backToEmail">
                Ganti email
              </UButton>
            </div>

            <UButton type="submit" block :loading="isSubmitting" size="lg">
              Reset Password
            </UButton>
          </UForm>
        </template>

        <p class="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
          <ULink
            to="/auth/login"
            class="font-medium text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300"
          >
            Kembali ke login
          </ULink>
        </p>

        <div class="mt-6 text-center text-xs text-gray-400 dark:text-gray-500">
          <p>Butuh Bantuan?</p>
          <p class="mt-1">&copy; 2024</p>
        </div>
      </div>
    </div>
  </div>
</template>
