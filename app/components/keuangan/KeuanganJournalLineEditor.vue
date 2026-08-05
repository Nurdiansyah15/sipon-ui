<script setup lang="ts">
import type { JournalEntryLine } from '#shared/types/Keuangan'

interface JournalLine {
  account_id: string | null
  description: string
  debit: number
  credit: number
}

const props = defineProps<{
  modelValue: JournalLine[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: JournalLine[]]
}>()

const totalDebit = computed(() =>
  props.modelValue.reduce((sum, line) => sum + (line.debit || 0), 0)
)

const totalCredit = computed(() =>
  props.modelValue.reduce((sum, line) => sum + (line.credit || 0), 0)
)

const isBalanced = computed(() =>
  totalDebit.value === totalCredit.value && totalDebit.value > 0
)

const difference = computed(() =>
  Math.abs(totalDebit.value - totalCredit.value)
)

function addLine() {
  const newLines = [...props.modelValue, {
    account_id: null,
    description: '',
    debit: 0,
    credit: 0,
  }]
  emit('update:modelValue', newLines)
}

function removeLine(index: number) {
  const newLines = props.modelValue.filter((_, i) => i !== index)
  emit('update:modelValue', newLines)
}

function updateLine(index: number, field: keyof JournalLine, value: any) {
  const newLines = [...props.modelValue]
  newLines[index] = { ...newLines[index], [field]: value }
  emit('update:modelValue', newLines)
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('id-ID').format(value)
}

function parseNumber(value: string): number {
  const cleaned = value.replace(/\./g, '').replace(/,/g, '')
  const num = parseInt(cleaned, 10)
  return isNaN(num) ? 0 : num
}

watch(() => props.modelValue, (lines) => {
  if (lines.length === 0) {
    addLine()
  }
}, { immediate: true })
</script>

<template>
  <div class="space-y-4">
    <div class="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                Akun
              </th>
              <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                Keterangan
              </th>
              <th class="px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400">
                Debit
              </th>
              <th class="px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400">
                Kredit
              </th>
              <th class="w-10 px-2 py-2" />
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
            <tr v-for="(line, index) in modelValue" :key="index">
              <td class="px-3 py-2">
                <KeuanganAccountPicker
                  :model-value="line.account_id"
                  placeholder="Pilih akun"
                  @update:model-value="(val) => updateLine(index, 'account_id', val)"
                />
              </td>
              <td class="px-3 py-2">
                <UInput
                  :model-value="line.description"
                  placeholder="Keterangan"
                  size="sm"
                  @update:model-value="(val) => updateLine(index, 'description', val)"
                />
              </td>
              <td class="px-3 py-2">
                <UInput
                  :model-value="line.debit > 0 ? formatNumber(line.debit) : ''"
                  placeholder="0"
                  size="sm"
                  type="text"
                  input-class="text-right"
                  @update:model-value="(val) => updateLine(index, 'debit', parseNumber(val as string))"
                />
              </td>
              <td class="px-3 py-2">
                <UInput
                  :model-value="line.credit > 0 ? formatNumber(line.credit) : ''"
                  placeholder="0"
                  size="sm"
                  type="text"
                  input-class="text-right"
                  @update:model-value="(val) => updateLine(index, 'credit', parseNumber(val as string))"
                />
              </td>
              <td class="px-2 py-2">
                <UButton
                  variant="ghost"
                  size="xs"
                  icon="i-lucide-trash-2"
                  color="error"
                  :disabled="modelValue.length === 1"
                  @click="removeLine(index)"
                />
              </td>
            </tr>
          </tbody>
          <tfoot class="bg-gray-50 dark:bg-gray-800">
            <tr>
              <td colspan="2" class="px-3 py-2 text-right text-sm font-semibold text-gray-700 dark:text-gray-300">
                Total
              </td>
              <td class="px-3 py-2 text-right text-sm font-semibold tabular-nums text-gray-900 dark:text-gray-100">
                {{ formatNumber(totalDebit) }}
              </td>
              <td class="px-3 py-2 text-right text-sm font-semibold tabular-nums text-gray-900 dark:text-gray-100">
                {{ formatNumber(totalCredit) }}
              </td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>

    <div class="flex items-center justify-between gap-4">
      <UButton
        variant="soft"
        size="sm"
        icon="i-lucide-plus"
        @click="addLine"
      >
        Tambah baris
      </UButton>

      <div class="flex items-center gap-2 text-sm">
        <div v-if="difference > 0" class="flex items-center gap-1.5 text-red-600 dark:text-red-400">
          <UIcon name="i-lucide-alert-circle" class="h-4 w-4" />
          <span>Selisih: {{ formatNumber(difference) }}</span>
        </div>
        <div v-else-if="isBalanced" class="flex items-center gap-1.5 text-green-600 dark:text-green-400">
          <UIcon name="i-lucide-check-circle" class="h-4 w-4" />
          <span>Seimbang</span>
        </div>
      </div>
    </div>
  </div>
</template>
