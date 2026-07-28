import { defineStore } from 'pinia'
import { useApi } from '~/composables/useApi'
import { parseApiError } from '~/utils/errorParser'
import type { ApiSuccess } from '#shared/types/ApiResponse'
import type {
  ChangeUsernameRequest,
  CheckUsernameResponse,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  UpdateProfileRequest,
} from '#shared/types/Auth'
import type { ProfileData } from '#shared/types/Profile'
import type { SessionData, SessionPermission, SessionRole } from '#shared/types/Session'
import type { UserMe } from '#shared/types/User'

const STORAGE_KEY = 'sipon_auth'

interface AuthState {
  user: UserMe | null
  token: string | null
  refreshToken: string | null
  roles: SessionRole[]
  permissions: SessionPermission[]
  isLoading: boolean
  error: string | null
  isHydrated: boolean
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    user: null,
    token: null,
    refreshToken: null,
    roles: [],
    permissions: [],
    isLoading: false,
    error: null,
    isHydrated: false,
  }),

  getters: {
    isLoggedIn: (state) => !!state.token && !!state.user,
    roleNames: (state) => state.roles.map((role) => role.name),
    hasRole: (state) => (role: string | string[]) => {
      const wanted = Array.isArray(role) ? role : [role]
      return state.roles.some((r) => wanted.includes(r.name))
    },
    hasPermission: (state) => (key: string) => state.permissions.some((p) => p.key === key),
  },

  actions: {
    async login(payload: LoginRequest) {
      this.isLoading = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.post<ApiSuccess<LoginResponse>>('/api/v1/web/auth/login', payload)
        this.setSession(res.data)
        await this.fetchSession()
      } catch (err) {
        this.error = parseApiError(err, 'Gagal masuk. Periksa kembali kredensial Anda.')
        throw err
      } finally {
        this.isLoading = false
      }
    },

    async register(payload: RegisterRequest) {
      this.isLoading = true
      this.error = null
      try {
        const api = useApi()
        const res = await api.post<ApiSuccess<RegisterResponse>>('/api/v1/web/auth/register', payload)
        this.setSession(res.data)
        await this.fetchSession()
      } catch (err) {
        this.error = parseApiError(err, 'Gagal mendaftar. Silakan coba lagi.')
        throw err
      } finally {
        this.isLoading = false
      }
    },

    async fetchSession() {
      if (!this.token) return
      const api = useApi()
      const res = await api.get<ApiSuccess<SessionData>>('/api/v1/auth/session')
      this.roles = res.data.roles
      this.permissions = res.data.permissions
      this.saveToStorage()
    },

    async fetchMe() {
      if (!this.token) return
      const api = useApi()
      const res = await api.get<ApiSuccess<UserMe>>('/api/v1/web/auth/me')
      this.user = res.data
      this.saveToStorage()
    },

    async fetchProfile() {
      if (!this.token) return
      const api = useApi()
      const res = await api.get<ApiSuccess<ProfileData>>('/api/v1/web/auth/profile')
      const { roles, permissions, ...user } = res.data
      this.user = user
      this.roles = roles
      this.permissions = permissions
      this.saveToStorage()
    },

    async changePassword(payload: { current_password: string, new_password: string }) {
      const api = useApi()
      await api.post('/api/v1/web/auth/change-password', payload)
    },

    async setPassword(payload: { new_password: string }) {
      const api = useApi()
      await api.post('/api/v1/web/auth/set-password', payload)
      await this.fetchProfile()
    },

    async requestIdentityOTP(identifier: string) {
      const api = useApi()
      await api.post('/api/v1/web/auth/request-otp', { identifier })
    },

    async verifyIdentityOTP(identifier: string, otp: string) {
      const api = useApi()
      await api.post('/api/v1/web/auth/verify-otp', { identifier, otp })
      await this.fetchProfile()
    },

    async updateProfile(payload: UpdateProfileRequest) {
      const api = useApi()
      await api.put('/api/v1/web/auth/profile', payload)
      await this.fetchProfile()
    },

    async checkUsername(username: string): Promise<boolean> {
      const api = useApi()
      const res = await api.get<ApiSuccess<CheckUsernameResponse>>(`/api/v1/web/auth/check-username?username=${encodeURIComponent(username)}`)
      return res.data.available
    },

    async changeUsername(payload: ChangeUsernameRequest) {
      const api = useApi()
      await api.post('/api/v1/web/auth/change-username', payload)
      await this.fetchProfile()
    },

    async logout() {
      try {
        if (this.token) {
          const api = useApi()
          await api.post('/api/v1/auth/logout')
        }
      } catch {
        // best-effort: proceed with local logout even if the API call fails
      } finally {
        this.clearUser()
        await navigateTo('/auth/login')
      }
    },

    setSession(data: LoginResponse) {
      this.token = data.token
      this.refreshToken = data.refresh_token
      this.user = data.user
      this.saveToStorage()
    },

    clearUser() {
      this.user = null
      this.token = null
      this.refreshToken = null
      this.roles = []
      this.permissions = []
      if (import.meta.client) {
        localStorage.removeItem(STORAGE_KEY)
      }
    },

    saveToStorage() {
      if (!import.meta.client) return
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          user: this.user,
          token: this.token,
          refreshToken: this.refreshToken,
          roles: this.roles,
          permissions: this.permissions,
        }),
      )
    },

    hydrate() {
      if (!import.meta.client) return
      this.isHydrated = true
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return
      try {
        const parsed = JSON.parse(raw)
        this.user = parsed.user ?? null
        this.token = parsed.token ?? null
        this.refreshToken = parsed.refreshToken ?? null
        this.roles = parsed.roles ?? []
        this.permissions = parsed.permissions ?? []
      } catch {
        localStorage.removeItem(STORAGE_KEY)
      }
    },
  },
})
