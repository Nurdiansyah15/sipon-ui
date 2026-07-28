<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import { useAuthStore } from '~/stores/auth'
import { parseApiError } from '~/utils/errorParser'

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  'update:open': [boolean]
}>()

const authStore = useAuthStore()
const toast = useToast()

const step = ref<'request' | 'verify'>('request')
const isRequesting = ref(false)
const isVerifying = ref(false)

const otpSchema = z.object({
  otp: z.string().length(6, 'OTP harus 6 digit').regex(/^\d+$/, 'OTP harus angka'),
})
type OtpSchema = z.output<typeof otpSchema>

const otpState = reactive<Partial<OtpSchema>>({ otp: '' })

function resetState() {
  otpState.otp = ''
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

async function requestOTP() {
  if (!authStore.user?.email) return
  isRequesting.value = true
  try {
    await authStore.requestIdentityOTP(authStore.user.email)
    step.value = 'verify'
    toast.add({ title: 'Kode verifikasi telah dikirim ke email Anda', color: 'success' })
  } catch (err) {
    toast.add({ title: 'Gagal mengirim kode verifikasi', description: parseApiError(err, 'Terjadi kesalahan'), color: 'error' })
  } finally {
    isRequesting.value = false
  }
}

async function verifyOTP(_event: FormSubmitEvent<OtpSchema>) {
  if (!authStore.user?.email) return
  isVerifying.value = true
  try {
    await authStore.verifyIdentityOTP(authStore.user.email, otpState.otp!)
    toast.add({ title: 'Email berhasil diverifikasi', color: 'success' })
    close()
  } catch (err) {
    toast.add({ title: 'Gagal memverifikasi', description: parseApiError(err, 'Terjadi kesalahan'), color: 'error' })
  } finally {
    isVerifying.value = false
  }
}
</script>

<template>
  <UModal :open="open" :dismissible="step === 'request'" @update:open="(v: boolean) => emit('update:open', v)">
    <template #content>
      <div class="p-6">
        <div class="mb-4 flex items-center justify-between">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Verifikasi Email</h3>
          <UButton v-if="step === 'request'" color="neutral" variant="ghost" icon="i-lucide-x" size="sm" square @click="close" />
        </div>

        <!-- Step 1: Request OTP -->
        <div v-if="step === 'request'" class="space-y-4">
          <div class="rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
            <div class="flex items-center gap-2">
              <UIcon name="i-lucide-mail" class="h-5 w-5 text-gray-400" />
              <span class="text-sm font-medium text-gray-900 dark:text-gray-100">{{ authStore.user?.email }}</span>
            </div>
            <UBadge color="warning" variant="subtle" size="sm" class="mt-2">Belum Terverifikasi</UBadge>
          </div>

          <p class="text-sm text-gray-500 dark:text-gray-400">
            Kode verifikasi akan dikirim ke alamat email di atas. Silakan klik tombol di bawah untuk melanjutkan.
          </p>

          <div class="flex justify-end gap-2 pt-2">
            <UButton color="neutral" variant="ghost" @click="close">Nanti Saja</UButton>
            <UButton :loading="isRequesting" @click="requestOTP">Kirim Kode Verifikasi</UButton>
          </div>
        </div>

        <!-- Step 2: Verify OTP -->
        <div v-else class="space-y-4">
          <p class="text-sm text-gray-500 dark:text-gray-400">
            Masukkan kode 6 digit yang telah dikirim ke <span class="font-medium text-gray-900 dark:text-gray-100">{{ authStore.user?.email }}</span>
          </p>

          <UForm :schema="otpSchema" :state="otpState" class="space-y-4" @submit="verifyOTP">
            <UFormField label="Kode OTP" name="otp">
              <UInput v-model="otpState.otp" class="w-full text-center tracking-[.5em]" variant="subtle" maxlength="6" placeholder="000000" autofocus />
            </UFormField>

            <div class="flex items-center justify-between">
              <UButton type="button" variant="link" size="sm" :loading="isRequesting" @click="requestOTP">
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
