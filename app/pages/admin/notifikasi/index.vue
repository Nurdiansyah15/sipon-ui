<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import { useNotificationStore } from '~/stores/notification'
import { usePermission } from '~/composables/usePermission'
import { parseApiError } from '~/utils/errorParser'
import type { NotificationChannel, NotificationType } from '#shared/types/Notification'

definePageMeta({ layout: 'admin' })

const store = useNotificationStore()
const toast = useToast()
const { can } = usePermission()

const typeOptions: { label: string; value: NotificationType; icon: string }[] = [
  { label: 'Sistem', value: 'system', icon: 'i-lucide-server' },
  { label: 'Sosial', value: 'social', icon: 'i-lucide-users' },
  { label: 'Konten', value: 'content', icon: 'i-lucide-file-text' },
  { label: 'Pengingat', value: 'reminder', icon: 'i-lucide-alarm-clock' },
  { label: 'Keamanan', value: 'security', icon: 'i-lucide-shield-check' },
]

const channelOptions = [
  { label: 'In-App', value: 'in_app' },
  { label: 'Push Notification', value: 'push' },
]

const schema = z.object({
  type: z.enum(['system', 'social', 'content', 'reminder', 'security']),
  title: z.string().min(1, 'Judul wajib diisi').max(255, 'Maksimal 255 karakter'),
  body: z.string().min(1, 'Isi notifikasi wajib diisi'),
  channels: z.array(z.enum(['in_app', 'push'])).min(1, 'Pilih minimal satu channel pengiriman'),
})

type Schema = z.output<typeof schema>

const state = reactive<Schema>({
  type: 'system',
  title: '',
  body: '',
  channels: ['in_app', 'push'],
})

const typeLabel = computed(() => typeOptions.find((t) => t.value === state.type)?.label ?? state.type)

const selectedTypeOption = computed(() => typeOptions.find((t) => t.value === state.type))

const confirmOpen = ref(false)
const pendingSubmit = ref<Schema | null>(null)

function onSubmit(event: FormSubmitEvent<Schema>) {
  pendingSubmit.value = event.data
  confirmOpen.value = true
}

async function handleConfirm() {
  const payload = pendingSubmit.value
  if (!payload) return
  try {
    await store.sendBroadcast({
      type: payload.type,
      title: payload.title,
      body: payload.body,
      channels: payload.channels,
    })
    toast.add({ title: 'Broadcast berhasil dikirim', description: 'Notifikasi terkirim ke semua pengguna aktif.', color: 'success' })
    confirmOpen.value = false
    pendingSubmit.value = null
    state.title = ''
    state.body = ''
  } catch (err) {
    toast.add({ title: 'Gagal mengirim broadcast', description: parseApiError(err, store.error ?? 'Gagal mengirim broadcast notifikasi.'), color: 'error' })
  }
}
</script>

<template>
  <div class="mx-auto max-w-5xl px-4 py-8">
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Broadcast Notifikasi</h1>
      <p class="mt-1 text-sm text-gray-500">
        Kirim pengumuman ke semua pengguna aktif aplikasi (in-app & push).
      </p>
    </div>

    <div
      v-if="!can('manage_notification')"
      class="rounded-lg border border-red-200 bg-red-50 p-6 text-center dark:border-red-800 dark:bg-red-950"
    >
      <UIcon name="i-lucide-shield-alert" class="mx-auto mb-2 h-8 w-8 text-red-500" />
      <p class="text-sm text-red-700 dark:text-red-300">
        Anda tidak memiliki akses untuk mengirim broadcast notifikasi.
      </p>
    </div>

    <div
      v-else
      class="grid gap-6 lg:grid-cols-5"
    >
      <UForm
        :schema="schema"
        :state="state"
        class="space-y-4 rounded-lg border border-gray-200 bg-white p-6 lg:col-span-3 dark:border-gray-700/50 dark:bg-gray-900"
        @submit="onSubmit"
      >
        <UFormField label="Jenis Notifikasi" name="type" required>
          <USelect
            v-model="state.type"
            :items="typeOptions"
            class="w-full"
          />
        </UFormField>

        <UFormField label="Judul" name="title" required>
          <UInput
            v-model="state.title"
            class="w-full"
            placeholder="Contoh: Pengumuman Libur Akhir Semester"
            maxlength="255"
          />
        </UFormField>

        <UFormField label="Isi Notifikasi" name="body" required>
          <UTextarea
            v-model="state.body"
            class="w-full"
            :rows="4"
            placeholder="Tulis pesan yang akan ditampilkan ke semua pengguna..."
          />
        </UFormField>

        <UFormField label="Channel Pengiriman" name="channels" required>
          <UCheckboxGroup v-model="state.channels" :items="channelOptions" class="gap-3" />
          <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Push Notification memerlukan token FCM terdaftar di perangkat pengguna.
          </p>
        </UFormField>

        <div class="flex items-center gap-2 border-t border-gray-200 pt-4 dark:border-gray-700">
          <UButton
            type="submit"
            icon="i-lucide-send"
            class="bg-teal-600 text-white hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-400"
            :loading="store.isSubmitting"
          >
            Kirim Broadcast
          </UButton>
          <span class="text-xs text-gray-500 dark:text-gray-400">
            Akan dikirim ke seluruh pengguna aktif.
          </span>
        </div>
      </UForm>

      <div class="lg:col-span-2">
        <div class="sticky top-24 rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700/50 dark:bg-gray-900">
          <h2 class="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
            <UIcon name="i-lucide-eye" class="h-4 w-4" />
            Pratinjau Notifikasi
          </h2>

          <div class="rounded-lg border border-gray-200 p-4 dark:border-gray-700/50">
            <div class="flex items-start gap-3">
              <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-50 dark:bg-teal-950">
                <UIcon
                  :name="selectedTypeOption?.icon ?? 'i-lucide-bell'"
                  class="h-4 w-4 text-teal-600 dark:text-teal-400"
                />
              </div>
              <div class="min-w-0 flex-1">
                <div class="flex flex-wrap items-center gap-2">
                  <span class="text-xs font-medium uppercase tracking-wide text-teal-600 dark:text-teal-400">{{ typeLabel }}</span>
                  <UBadge v-for="ch in state.channels" :key="ch" variant="subtle" size="sm">
                    {{ ch === 'in_app' ? 'In-App' : 'Push' }}
                  </UBadge>
                </div>
                <h3 class="mt-1 font-semibold text-gray-900 dark:text-gray-100">
                  {{ state.title || 'Judul notifikasi' }}
                </h3>
                <p class="mt-1 whitespace-pre-line text-sm text-gray-600 dark:text-gray-400">
                  {{ state.body || 'Isi notifikasi akan tampil di sini.' }}
                </p>
              </div>
            </div>
          </div>

          <div class="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300">
            <p class="flex items-center gap-1.5">
              <UIcon name="i-lucide-alert-triangle" class="h-3.5 w-3.5 shrink-0" />
              Broadcast dikirim serentak ke semua pengguna aktif dan tidak dapat ditarik kembali.
            </p>
          </div>
        </div>
      </div>
    </div>

    <ConfirmActionModal
      v-model:open="confirmOpen"
      title="Kirim Broadcast Notifikasi?"
      message="Notifikasi akan dikirim serentak ke semua pengguna aktif. Pastikan judul dan isi sudah benar sebelum melanjutkan."
      confirm-label="Kirim"
      :loading="store.isSubmitting"
      @confirm="handleConfirm"
    />
  </div>
</template>