<script setup lang="ts">
import { useNotificationStore } from '~/stores/notification'
import type { NotificationPreference } from '#shared/types/Notification'

const store = useNotificationStore()

onMounted(async () => {
  await store.fetchPreference()
})

const form = reactive({
  all_notifications_enabled: true,
  do_not_disturb_enabled: false,
  do_not_disturb_start_time: '',
  do_not_disturb_end_time: '',
})

watch(() => store.preference, (pref) => {
  if (pref) {
    form.all_notifications_enabled = pref.all_notifications_enabled
    form.do_not_disturb_enabled = pref.do_not_disturb_enabled
    form.do_not_disturb_start_time = pref.do_not_disturb_start_time || ''
    form.do_not_disturb_end_time = pref.do_not_disturb_end_time || ''
  }
}, { immediate: true })

const dndValidationError = computed(() => {
  if (!form.do_not_disturb_enabled) return null
  if (!form.do_not_disturb_start_time || !form.do_not_disturb_end_time) {
    return 'Waktu mulai dan selesai DND wajib diisi.'
  }
  const timeRegex = /^\d{2}:\d{2}$/
  if (!timeRegex.test(form.do_not_disturb_start_time) || !timeRegex.test(form.do_not_disturb_end_time)) {
    return 'Format waktu harus HH:MM.'
  }
  return null
})

const isFormValid = computed(() => {
  return dndValidationError.value === null
})

async function handleSave() {
  if (!isFormValid.value) return
  await store.updatePreference({
    all_notifications_enabled: form.all_notifications_enabled,
    do_not_disturb_enabled: form.do_not_disturb_enabled,
    do_not_disturb_start_time: form.do_not_disturb_enabled ? form.do_not_disturb_start_time : undefined,
    do_not_disturb_end_time: form.do_not_disturb_enabled ? form.do_not_disturb_end_time : undefined,
  })
}
</script>

<template>
  <div class="space-y-6">
    <div v-if="store.isLoading" class="py-8 text-center text-sm text-gray-500">
      Memuat preferensi...
    </div>

    <div v-else class="space-y-6">
      <div class="space-y-4 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-900 dark:text-gray-100">Aktifkan Notifikasi</p>
            <p class="text-xs text-gray-500 dark:text-gray-400">Terima notifikasi dari semua sumber</p>
          </div>
          <USwitch
            v-model="form.all_notifications_enabled"
          />
        </div>

        <USeparator />

        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-900 dark:text-gray-100">Jangan Ganggu (Do Not Disturb)</p>
              <p class="text-xs text-gray-500 dark:text-gray-400">Nonaktifkan notifikasi dalam rentang waktu tertentu</p>
            </div>
            <USwitch
              v-model="form.do_not_disturb_enabled"
              :disabled="!form.all_notifications_enabled"
            />
          </div>

          <div v-if="form.do_not_disturb_enabled" class="ml-0 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div class="flex items-center gap-2">
              <label class="text-xs text-gray-500 dark:text-gray-400" for="dnd-start">Mulai</label>
              <UInput
                id="dnd-start"
                v-model="form.do_not_disturb_start_time"
                placeholder="22:00"
                class="w-24"
              />
            </div>
            <span class="text-gray-400">—</span>
            <div class="flex items-center gap-2">
              <label class="text-xs text-gray-500 dark:text-gray-400" for="dnd-end">Selesai</label>
              <UInput
                id="dnd-end"
                v-model="form.do_not_disturb_end_time"
                placeholder="07:00"
                class="w-24"
              />
            </div>
          </div>

          <p v-if="dndValidationError" class="text-xs text-red-500">
            {{ dndValidationError }}
          </p>
        </div>
      </div>

      <div class="flex justify-end">
        <UButton
          :loading="store.isSubmitting"
          :disabled="!isFormValid"
          @click="handleSave"
        >
          Simpan
        </UButton>
      </div>
    </div>
  </div>
</template>
