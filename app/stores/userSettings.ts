import { defineStore } from 'pinia'
import { useApi } from '~/composables/useApi'
import { parseApiError } from '~/utils/errorParser'
import type { ApiSuccess } from '#shared/types/ApiResponse'
import type { LinkedAccountsResponse } from '#shared/types/UserSettings'

interface UserSettingsState {
  linkedAccounts: LinkedAccountsResponse | null
  isLoadingLinkedAccounts: boolean
  isLinkingGoogle: boolean
  isUnlinkingGoogle: boolean
  error: string | null
}

export const useUserSettingsStore = defineStore('userSettings', {
  state: (): UserSettingsState => ({
    linkedAccounts: null,
    isLoadingLinkedAccounts: false,
    isLinkingGoogle: false,
    isUnlinkingGoogle: false,
    error: null,
  }),

  actions: {
    async fetchLinkedAccounts(force = false): Promise<LinkedAccountsResponse> {
      if (!force && this.linkedAccounts) return this.linkedAccounts
      this.isLoadingLinkedAccounts = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.get<ApiSuccess<LinkedAccountsResponse>>('/api/v1/web/auth/linked-accounts')
        this.linkedAccounts = res.data
        return res.data
      } catch (err) {
        this.error = parseApiError(err, 'Gagal memuat akun tertaut.')
        throw err
      } finally {
        this.isLoadingLinkedAccounts = false
      }
    },

    async linkGoogle(idToken: string) {
      this.isLinkingGoogle = true
      this.error = null
      try {
        const api = useApi()
        await api.post('/api/v1/web/auth/linked-accounts/google', {
          id_token: idToken,
        })
        await this.fetchLinkedAccounts(true)
      } catch (err) {
        this.error = parseApiError(err, 'Gagal menautkan akun Google.')
        throw err
      } finally {
        this.isLinkingGoogle = false
      }
    },

    async unlinkGoogle() {
      this.isUnlinkingGoogle = true
      this.error = null
      try {
        const api = useApi()
        await api.delete('/api/v1/web/auth/linked-accounts/google')
        if (this.linkedAccounts) {
          this.linkedAccounts.google = {
            linked: false,
            email: null,
            can_unlink: false,
          }
        }
      } catch (err) {
        this.error = parseApiError(err, 'Gagal melepas akun Google.')
        throw err
      } finally {
        this.isUnlinkingGoogle = false
      }
    },
  },
})
