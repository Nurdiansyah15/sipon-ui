<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import { useAuthStore } from '~/stores/auth'
import { parseApiError } from '~/utils/errorParser'

const authStore = useAuthStore()
const user = computed(() => authStore.user)
const toast = useToast()

// ── Fullname inline edit ────────────────────────────────────────────────────
const fullnameSchema = z.object({
  fullname: z.string().optional(),
})
type FullnameSchema = z.output<typeof fullnameSchema>

const fullnameState = reactive<Partial<FullnameSchema>>({ fullname: '' })
const isSavingFullname = ref(false)

function initFullnameState() {
  fullnameState.fullname = authStore.user?.fullname ?? ''
}

watch(() => authStore.user?.fullname, () => {
  fullnameState.fullname = authStore.user?.fullname ?? ''
})

const isEditingFullname = ref(false)
function startEditFullname() {
  initFullnameState()
  isEditingFullname.value = true
}
function cancelEditFullname() {
  isEditingFullname.value = false
}

async function saveFullname(_event: FormSubmitEvent<FullnameSchema>) {
  isSavingFullname.value = true
  try {
    await authStore.updateProfile({ fullname: fullnameState.fullname || undefined })
    isEditingFullname.value = false
    toast.add({ title: 'Nama lengkap berhasil diperbarui', color: 'success' })
  } catch (err) {
    toast.add({ title: 'Gagal memperbarui nama lengkap', description: parseApiError(err, 'Terjadi kesalahan'), color: 'error' })
  } finally {
    isSavingFullname.value = false
  }
}

// ── Email inline edit (unverified only) ─────────────────────────────────────
const emailSchema = z.object({
  email: z.string().email('Email tidak valid'),
})
type EmailSchema = z.output<typeof emailSchema>

const emailState = reactive<Partial<EmailSchema>>({ email: '' })
const isSavingEmail = ref(false)

function initEmailState() {
  emailState.email = authStore.user?.email ?? ''
}

watch(() => authStore.user?.email, () => {
  emailState.email = authStore.user?.email ?? ''
})

const isEditingEmail = ref(false)
function startEditEmail() {
  initEmailState()
  isEditingEmail.value = true
}
function cancelEditEmail() {
  isEditingEmail.value = false
}

async function saveEmail(_event: FormSubmitEvent<EmailSchema>) {
  isSavingEmail.value = true
  try {
    await authStore.updateProfile({ email: emailState.email })
    isEditingEmail.value = false
    toast.add({ title: 'Email berhasil diperbarui', color: 'success' })
  } catch (err) {
    toast.add({ title: 'Gagal memperbarui email', description: parseApiError(err, 'Terjadi kesalahan'), color: 'error' })
  } finally {
    isSavingEmail.value = false
  }
}

// ── Phone inline edit (unverified only) ─────────────────────────────────────
const phoneSchema = z.object({
  phone: z.string().min(1, 'Wajib diisi'),
})
type PhoneSchema = z.output<typeof phoneSchema>

const phoneState = reactive<Partial<PhoneSchema>>({ phone: '' })
const isSavingPhone = ref(false)

function initPhoneState() {
  phoneState.phone = authStore.user?.phone ?? ''
}

watch(() => authStore.user?.phone, () => {
  phoneState.phone = authStore.user?.phone ?? ''
})

const isEditingPhone = ref(false)
function startEditPhone() {
  initPhoneState()
  isEditingPhone.value = true
}
function cancelEditPhone() {
  isEditingPhone.value = false
}

async function savePhone(_event: FormSubmitEvent<PhoneSchema>) {
  isSavingPhone.value = true
  try {
    await authStore.updateProfile({ phone: phoneState.phone })
    isEditingPhone.value = false
    toast.add({ title: 'Nomor telepon berhasil diperbarui', color: 'success' })
  } catch (err) {
    toast.add({ title: 'Gagal memperbarui nomor telepon', description: parseApiError(err, 'Terjadi kesalahan'), color: 'error' })
  } finally {
    isSavingPhone.value = false
  }
}

// ── Modals ──────────────────────────────────────────────────────────────────
const showChangeUsernameModal = ref(false)
const showEmailOTPModal = ref(false)
const showPhoneOTPModal = ref(false)

// ── Helpers ─────────────────────────────────────────────────────────────────
function formatDate(value?: string | null) {
  if (!value) return '—'
  try {
    return new Date(value).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })
  } catch {
    return value
  }
}
</script>

<template>
  <div class="divide-y divide-gray-100 dark:divide-gray-800">
    <!-- Nama Lengkap -->
    <div class="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-4 sm:flex-nowrap">
      <div class="min-w-0 flex-1">
        <p class="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Nama Lengkap</p>
        <UForm v-if="isEditingFullname" :schema="fullnameSchema" :state="fullnameState" class="mt-2 flex items-center gap-2" @submit="saveFullname">
          <UInput v-model="fullnameState.fullname" placeholder="Nama lengkap" class="w-full max-w-xs" size="sm" autofocus />
          <UButton type="submit" size="sm" :loading="isSavingFullname" icon="i-lucide-check" variant="soft" color="success" />
          <UButton type="button" size="sm" icon="i-lucide-x" variant="ghost" color="neutral" @click="cancelEditFullname" />
        </UForm>
        <p v-else class="mt-1 text-sm text-gray-900 dark:text-gray-100">{{ user?.fullname || '—' }}</p>
      </div>
      <div v-if="!isEditingFullname" class="shrink-0">
        <UButton
          variant="ghost"
          size="xs"
          icon="i-lucide-pencil"
          @click="startEditFullname"
        />
      </div>
    </div>

    <!-- Username -->
    <div class="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-4 sm:flex-nowrap">
      <div class="min-w-0 flex-1">
        <p class="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Username</p>
        <p class="mt-1 text-sm text-gray-900 dark:text-gray-100">{{ user?.username }}</p>
      </div>
      <div class="shrink-0">
        <UButton
          variant="ghost"
          size="xs"
          icon="i-lucide-pencil"
          @click="showChangeUsernameModal = true"
        />
      </div>
    </div>

    <!-- Email -->
    <div class="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-4 sm:flex-nowrap">
      <div class="min-w-0 flex-1">
        <p class="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Email</p>
        <template v-if="!user?.is_email_verified && isEditingEmail">
          <UForm :schema="emailSchema" :state="emailState" class="mt-2 flex items-center gap-2" @submit="saveEmail">
            <UInput v-model="emailState.email" type="email" placeholder="Email" class="w-full max-w-xs" size="sm" autofocus />
            <UButton type="submit" size="sm" :loading="isSavingEmail" icon="i-lucide-check" variant="soft" color="success" />
            <UButton type="button" size="sm" icon="i-lucide-x" variant="ghost" color="neutral" @click="cancelEditEmail" />
          </UForm>
        </template>
        <div v-else class="mt-1 flex flex-wrap items-center gap-2">
          <p class="text-sm text-gray-900 dark:text-gray-100">{{ user?.email }}</p>
          <UBadge :color="user?.is_email_verified ? 'success' : 'warning'" variant="subtle" size="sm">
            {{ user?.is_email_verified ? 'Terverifikasi' : 'Belum Verifikasi' }}
          </UBadge>
        </div>
      </div>
      <div class="shrink-0">
        <UButton
          v-if="user?.is_email_verified"
          variant="ghost"
          size="xs"
          icon="i-lucide-pencil"
          @click="showEmailOTPModal = true"
        />
        <UButton
          v-else-if="!isEditingEmail"
          variant="ghost"
          size="xs"
          icon="i-lucide-pencil"
          @click="startEditEmail"
        />
      </div>
    </div>

    <!-- No. Telepon -->
    <div class="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-4 sm:flex-nowrap">
      <div class="min-w-0 flex-1">
        <p class="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">No. Telepon</p>
        <template v-if="!user?.is_phone_verified && isEditingPhone">
          <UForm :schema="phoneSchema" :state="phoneState" class="mt-2 flex items-center gap-2" @submit="savePhone">
            <UInput v-model="phoneState.phone" placeholder="Nomor telepon" class="w-full max-w-xs" size="sm" autofocus />
            <UButton type="submit" size="sm" :loading="isSavingPhone" icon="i-lucide-check" variant="soft" color="success" />
            <UButton type="button" size="sm" icon="i-lucide-x" variant="ghost" color="neutral" @click="cancelEditPhone" />
          </UForm>
        </template>
        <div v-else class="mt-1 flex flex-wrap items-center gap-2">
          <p class="text-sm text-gray-900 dark:text-gray-100">{{ user?.phone || '—' }}</p>
          <UBadge v-if="user?.phone" :color="user?.is_phone_verified ? 'success' : 'warning'" variant="subtle" size="sm">
            {{ user?.is_phone_verified ? 'Terverifikasi' : 'Belum Verifikasi' }}
          </UBadge>
        </div>
      </div>
      <div class="shrink-0">
        <UButton
          v-if="user?.is_phone_verified"
          variant="ghost"
          size="xs"
          icon="i-lucide-pencil"
          @click="showPhoneOTPModal = true"
        />
        <UButton
          v-else-if="!isEditingPhone && user?.phone"
          variant="ghost"
          size="xs"
          icon="i-lucide-pencil"
          @click="startEditPhone"
        />
        <UButton
          v-else-if="!isEditingPhone && !user?.phone"
          variant="ghost"
          size="xs"
          icon="i-lucide-plus"
          @click="startEditPhone"
        />
      </div>
    </div>

    <!-- Status Akun -->
    <div class="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-4 sm:flex-nowrap">
      <div class="min-w-0 flex-1">
        <p class="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Status Akun</p>
        <UBadge :color="user?.status === 'ACTIVE' ? 'success' : 'error'" variant="subtle" size="sm" class="mt-1">
          {{ user?.status === 'ACTIVE' ? 'Aktif' : 'Diblokir' }}
        </UBadge>
      </div>
    </div>

    <!-- Anggota Sejak -->
    <div class="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-4 sm:flex-nowrap">
      <div class="min-w-0 flex-1">
        <p class="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Anggota Sejak</p>
        <p class="mt-1 text-sm text-gray-900 dark:text-gray-100">{{ formatDate(user?.created_at) }}</p>
      </div>
    </div>

    <!-- Kata Sandi -->
    <div class="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-4 sm:flex-nowrap">
      <div class="min-w-0 flex-1">
        <p class="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Kata Sandi</p>
        <UBadge :color="user?.has_password ? 'success' : 'warning'" variant="subtle" size="sm" class="mt-1">
          {{ user?.has_password ? 'Sudah diatur' : 'Belum diatur' }}
        </UBadge>
      </div>
    </div>
  </div>

  <!-- Modals -->
  <ProfileChangeUsernameModal
    v-model:open="showChangeUsernameModal"
  />
  <ProfileEmailOTPModal
    v-model:open="showEmailOTPModal"
  />
  <ProfilePhoneOTPModal
    v-model:open="showPhoneOTPModal"
  />
</template>
