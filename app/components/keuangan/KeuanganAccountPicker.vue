<script setup lang="ts">
import type { Account, AccountType, AccountSubType } from '#shared/types/Keuangan'
import type { ApiSuccess } from '#shared/types/ApiResponse'
import { useApi } from '~/composables/useApi'
import { parseApiError } from '~/utils/errorParser'

const props = defineProps<{
  modelValue: string | null
  label?: string
  placeholder?: string
  filter?: AccountType
  subType?: AccountSubType
  required?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string | null]
}>()

const toast = useToast()
const api = useApi()

const accounts = ref<Account[]>([])
const isLoading = ref(false)
const isOpen = ref(false)
const searchQuery = ref('')

const filteredAccounts = computed(() => {
  let result = accounts.value

  if (props.filter) {
    result = result.filter(acc => acc.type === props.filter)
  }

  if (props.subType) {
    result = result.filter(acc => acc.sub_type === props.subType)
  }

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(acc =>
      acc.code.toLowerCase().includes(query) ||
      acc.name.toLowerCase().includes(query)
    )
  }

  return result
})

const selectedAccount = computed(() =>
  accounts.value.find(acc => acc.id === props.modelValue)
)

async function fetchAccounts() {
  if (accounts.value.length > 0) return

  isLoading.value = true
  try {
    const res = await api.get<ApiSuccess<Account[]>>('/api/v1/web/keuangan/admin/accounts', {
      query: { limit: 1000, is_active: true }
    })
    accounts.value = res.data
  } catch (err) {
    toast.add({
      title: 'Gagal memuat akun',
      description: parseApiError(err, 'Terjadi kesalahan'),
      color: 'error'
    })
  } finally {
    isLoading.value = false
  }
}

function selectAccount(account: Account) {
  emit('update:modelValue', account.id)
  isOpen.value = false
  searchQuery.value = ''
}

function clearSelection() {
  emit('update:modelValue', null)
}

watch(isOpen, (val) => {
  if (val) fetchAccounts()
})
</script>

<template>
  <div class="space-y-1.5">
    <label v-if="label" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
      {{ label }}<span v-if="props.required" class="ml-0.5 text-red-500">*</span>
    </label>

    <UPopover v-model:open="isOpen" :content="{ side: 'bottom', align: 'start', sideOffset: 4 }">
      <UButton
        variant="outline"
        block
        :trailing="true"
        :class="[!selectedAccount && 'text-gray-400 dark:text-gray-500']"
      >
        <template #default>
          <span class="truncate">
            {{ selectedAccount ? `${selectedAccount.code} - ${selectedAccount.name}` : (placeholder || 'Pilih akun') }}
          </span>
        </template>
        <template #trailing>
          <UIcon name="i-lucide-chevrons-up-down" class="h-4 w-4 text-gray-400" />
        </template>
      </UButton>

      <template #content>
        <div class="w-[400px]">
          <div class="border-b border-gray-200 p-2 dark:border-gray-700">
            <UInput
              v-model="searchQuery"
              placeholder="Cari akun..."
              icon="i-lucide-search"
              size="sm"
              autofocus
            />
          </div>

          <div class="max-h-[300px] overflow-y-auto p-1">
            <div v-if="isLoading" class="flex items-center justify-center py-8">
              <UIcon name="i-lucide-loader-2" class="h-5 w-5 animate-spin text-gray-400" />
            </div>

            <div v-else-if="filteredAccounts.length === 0" class="py-8 text-center text-sm text-gray-500">
              Tidak ada akun ditemukan
            </div>

            <div v-else class="space-y-0.5">
              <button
                v-for="account in filteredAccounts"
                :key="account.id"
                class="w-full rounded px-2 py-1.5 text-left transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
                :class="[modelValue === account.id && 'bg-gray-100 dark:bg-gray-800']"
                @click="selectAccount(account)"
              >
                <div class="flex items-start gap-2">
                  <UIcon
                    v-if="modelValue === account.id"
                    name="i-lucide-check"
                    class="mt-0.5 h-4 w-4 shrink-0 text-primary-500"
                  />
                  <div v-else class="w-4" />
                  <div class="min-w-0 flex-1">
                    <div class="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                      {{ account.code }}
                    </div>
                    <div class="truncate text-xs text-gray-500 dark:text-gray-400">
                      {{ account.name }}
                    </div>
                  </div>
                </div>
              </button>
            </div>
          </div>

          <div v-if="selectedAccount" class="border-t border-gray-200 p-2 dark:border-gray-700">
            <UButton
              variant="ghost"
              size="xs"
              color="error"
              block
              icon="i-lucide-x"
              @click="clearSelection"
            >
              Hapus pilihan
            </UButton>
          </div>
        </div>
      </template>
    </UPopover>
  </div>
</template>
