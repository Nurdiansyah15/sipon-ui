<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import { useApi } from '~/composables/useApi'
import { useAuthStore } from '~/stores/auth'
import { parseApiError } from '~/utils/errorParser'

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  'update:open': [boolean]
}>()

const api = useApi()
const authStore = useAuthStore()
const toast = useToast()

const step = ref<'request' | 'verify'>('request')
const isRequesting = ref(false)
const isVerifying = ref(false)
const newEmail = ref('')

const emailSchema = z.object({
  email: z.string().email('Email tidak valid'),
})
type EmailSchema = z.output<typeof emailSchema>

const emailState = reactive<Partial<EmailSchema>>({ email: '' })

const otpSchema = z.object({
  otp: z.string().length(6, 'OTP harus 6 digit').regex(/^\d+$/, 'OTP harus angka'),
})
type OtpSchema = z.output<typeof otpSchema>

const otpState = reactive<Partial<OtpSchema>>({ otp: '' })

function resetState() {
  emailState.email = ''
  otpState.otp = ''
  newEmail.value = ''
  step.value = 'request'
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

async function requestOTP(_event: FormSubmitEvent<EmailSchema>) {
  isRequesting.value = true
  try {
    await api.post('/api/v1/web/auth/change-email/request', { new_email: emailState.email })
    newEmail.value = emailState.email!
    step.value = 'verify'
    toast.add({ title: 'OTP berhasil dikirim ke email baru', color: 'success' })
  } catch (err) {
    toast.add({ title: 'Gagal mengirim OTP', description: parseApiError(err, 'Terjadi kesalahan'), color: 'error' })
  } finally {
    isRequesting.value = false
  }
}

async function verifyOTP(_event: FormSubmitEvent<OtpSchema>) {
  isVerifying.value = true
  try {
    await api.post('/api/v1/web/auth/change-email/confirm', { otp: otpState.otp })
    await authStore.fetchProfile()
    toast.add({ title: 'Email berhasil diperbarui', color: 'success' })
    close()
  } catch (err) {
    toast.add({ title: 'Gagal memverifikasi OTP', description: parseApiError(err, 'Terjadi kesalahan'), color: 'error' })
  } finally {
    isVerifying.value = false
  }
}

async function resendOTP() {
  isRequesting.value = true
  try {
    await api.post('/api/v1/web/auth/change-email/request', { new_email: newEmail.value })
    toast.add({ title: 'OTP berhasil dikirim ulang', color: 'success' })
  } catch (err) {
    toast.add({ title: 'Gagal mengirim ulang OTP', description: parseApiError(err, 'Terjadi kesalahan'), color: 'error' })
  } finally {
    isRequesting.value = false
  }
}
</script>

<template>
  <UModal :open="open" :dismissible="step === 'request'" @update:open="(v: boolean) => emit('update:open', v)">
    <template #content>
      <div class="p-6">
        <div class="mb-4 flex items-center justify-between">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Ganti Email</h3>
          <UButton v-if="step === 'request'" color="neutral" variant="ghost" icon="i-lucide-x" size="sm" square @click="close" />
        </div>

        <!-- Step 1: Request OTP -->
        <div v-if="step === 'request'" class="space-y-4">
          <p class="text-sm text-gray-500 dark:text-gray-400">
            Email saat ini: <span class="font-medium text-gray-900 dark:text-gray-100">{{ authStore.user?.email }}</span>
          </p>

          <UForm :schema="emailSchema" :state="emailState" class="space-y-4" @submit="requestOTP">
            <UFormField label="Email Baru" name="email">
              <UInput v-model="emailState.email" type="email" class="w-full" variant="subtle" placeholder="email@baru.com" />
            </UFormField>

            <div class="flex justify-end gap-2 pt-2">
              <UButton color="neutral" variant="ghost" type="button" @click="close">Batal</UButton>
              <UButton type="submit" :loading="isRequesting">Kirim OTP</UButton>
            </div>
          </UForm>
        </div>

        <!-- Step 2: Verify OTP -->
        <div v-else class="space-y-4">
          <p class="text-sm text-gray-500 dark:text-gray-400">
            Kode verifikasi telah dikirim ke <span class="font-medium text-gray-900 dark:text-gray-100">{{ newEmail }}</span>
          </p>

          <UForm :schema="otpSchema" :state="otpState" class="space-y-4" @submit="verifyOTP">
            <UFormField label="Kode OTP" name="otp">
              <UInput v-model="otpState.otp" class="w-full text-center tracking-[.5em]" variant="subtle" maxlength="6" placeholder="000000" />
            </UFormField>

            <div class="flex items-center justify-between">
              <UButton type="button" variant="link" size="sm" :loading="isRequesting" @click="resendOTP">
                Kirim ulang kode
              </UButton>
              <div class="flex gap-2">
                <UButton color="neutral" variant="ghost" type="button" @click="step = 'request'">Kembali</UButton>
                <UButton type="submit" :loading="isVerifying">Verifikasi</UButton>
              </div>
            </div>
          </UForm>
        </div>
      </div>
    </template>
  </UModal>
</template>
