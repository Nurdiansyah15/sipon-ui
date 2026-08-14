<script setup lang="ts">
import { useUserSettingsStore } from '~/stores/userSettings'
import { parseApiError } from '~/utils/errorParser'

const store = useUserSettingsStore()
const toast = useToast()
const gsi = useGoogleIdentity()

const isUnlinkModalOpen = ref(false)
const isLinking = ref(false)

onMounted(async () => {
  try {
    await store.fetchLinkedAccounts()
  } catch {
    toast.add({
      title: 'Gagal memuat akun tertaut',
      description: store.error ?? undefined,
      color: 'error',
    })
  }
})

async function initLinkGoogle() {
  if (!gsi.clientId) return
  isLinking.value = true
  try {
    const ok = await gsi.init(gsi.clientId, handleCredentialResponse)
    if (ok) {
      gsi.renderButton('link-google-btn-container', {
        theme: 'outline',
        size: 'medium',
        width: '320',
        type: 'standard',
        text: 'link',
      })
    } else {
      toast.add({
        title: 'Google Sign-In gagal dimuat',
        description: gsi.error ?? undefined,
        color: 'warning',
      })
    }
  } finally {
    isLinking.value = false
  }
}

async function handleCredentialResponse(response: { credential?: string }) {
  const idToken = response?.credential
  if (!idToken) return
  try {
    await store.linkGoogle(idToken)
    toast.add({ title: 'Akun Google berhasil ditautkan', color: 'success' })
  } catch {
    toast.add({
      title: 'Gagal menautkan akun Google',
      description: store.error ?? undefined,
      color: 'error',
    })
  }
}

async function confirmUnlink() {
  try {
    await store.unlinkGoogle()
    isUnlinkModalOpen.value = false
    toast.add({ title: 'Akun Google berhasil dilepas', color: 'success' })
  } catch {
    toast.add({
      title: 'Gagal melepas akun Google',
      description: store.error ?? undefined,
      color: 'error',
    })
  }
}
</script>

<template>
  <div>
    <h3 class="text-sm font-semibold text-gray-900 dark:text-gray-100">
      Akun Tertaut
    </h3>
    <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
      Kelola akun eksternal yang terhubung dengan akun SIPON Anda.
    </p>

    <div v-if="store.isLoadingLinkedAccounts" class="mt-6 flex justify-center">
      <UIcon name="i-lucide-loader-2" class="h-6 w-6 animate-spin text-gray-400 dark:text-gray-500" />
    </div>

    <template v-else>
      <div
        class="mt-4 flex flex-wrap items-center justify-between gap-4 rounded-lg border border-gray-200 p-4 dark:border-gray-700/50"
      >
        <div class="flex items-center gap-3">
          <svg class="h-6 w-6" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          <div>
            <p class="text-sm font-semibold text-gray-900 dark:text-gray-100">Google</p>
            <p v-if="store.linkedAccounts?.google.linked" class="text-xs text-gray-500 dark:text-gray-400">
              {{ store.linkedAccounts.google.email }}
            </p>
            <p v-else class="text-xs text-gray-400 dark:text-gray-500">
              Belum tertaut
            </p>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <UBadge
            :color="store.linkedAccounts?.google.linked ? 'success' : 'neutral'"
            variant="subtle"
            size="sm"
          >
            {{ store.linkedAccounts?.google.linked ? 'Tertaut' : 'Belum tertaut' }}
          </UBadge>

          <template v-if="store.linkedAccounts?.google.linked">
            <UTooltip
              v-if="!store.linkedAccounts.google.can_unlink"
              text="Atur kata sandi terlebih dahulu (tab Keamanan) sebelum melepas Google."
            >
              <UButton variant="soft" size="xs" color="error" disabled>
                Lepas
              </UButton>
            </UTooltip>
            <UButton
              v-else
              variant="soft"
              size="xs"
              color="error"
              :loading="store.isUnlinkingGoogle"
              @click="isUnlinkModalOpen = true"
            >
              Lepas
            </UButton>
          </template>
          <template v-else-if="gsi.clientId">
            <div v-show="gsi.isReady" id="link-google-btn-container" class="flex justify-end"></div>
            <UButton
              v-show="!gsi.isReady"
              variant="soft"
              size="xs"
              icon="i-lucide-link"
              :loading="isLinking"
              @click="initLinkGoogle"
            >
              Tautkan Google
            </UButton>
          </template>
        </div>
      </div>

      <UAlert
        v-if="store.linkedAccounts?.google.linked && !store.linkedAccounts.google.can_unlink"
        class="mt-4"
        color="warning"
        variant="subtle"
        title="Atur kata sandi terlebih dahulu"
        description="Anda perlu mengatur kata sandi di tab Keamanan sebelum bisa melepas akun Google."
      />

      <UModal v-model:open="isUnlinkModalOpen" title="Lepas Akun Google" :ui="{ content: 'max-w-sm' }">
        <template #body>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            Anda tidak akan bisa masuk dengan Google lagi. Anda masih bisa masuk dengan
            email/username dan kata sandi.
          </p>
        </template>
        <template #footer>
          <div class="flex gap-2 justify-end">
            <UButton variant="outline" @click="isUnlinkModalOpen = false">
              Batal
            </UButton>
            <UButton color="error" :loading="store.isUnlinkingGoogle" @click="confirmUnlink">
              Lepas
            </UButton>
          </div>
        </template>
      </UModal>
    </template>
  </div>
</template>
