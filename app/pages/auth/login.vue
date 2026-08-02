<script setup lang="ts">
import { z } from "zod";
import type { FormSubmitEvent } from "@nuxt/ui";
import { useAuthStore } from "~/stores/auth";

definePageMeta({ layout: "auth" });

const authStore = useAuthStore();
const route = useRoute();
const toast = useToast();

const schema = z.object({
  identifier: z.string().min(1, "Wajib diisi"),
  password: z.string().min(1, "Wajib diisi"),
});
type Schema = z.output<typeof schema>;

const state = reactive<Partial<Schema>>({
  identifier: "",
  password: "",
});

const remember = ref(false);
const isSubmitting = ref(false);

async function onSubmit(event: FormSubmitEvent<Schema>) {
  isSubmitting.value = true;
  try {
    await authStore.login(event.data);
    const redirect = (route.query.redirect as string) || "/dashboard";
    await navigateTo(redirect);
  } catch {
    toast.add({
      title: "Gagal masuk",
      description: authStore.error ?? undefined,
      color: "error",
    });
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <div
    class="flex min-h-screen items-center justify-center bg-[#0b857a] p-0 md:p-12"
  >
    <div
      class="relative flex w-full max-w-4xl min-h-screen flex-col rounded-none bg-white shadow-2xl md:min-h-0 md:flex-row md:rounded-2xl dark:bg-gray-900"
    >
      <button
        class="absolute left-4 top-4 z-20 flex h-8 w-8 items-center justify-center rounded-full text-white/80 transition hover:bg-white/10 hover:text-white"
        @click="navigateTo('/')"
      >
        <UIcon name="i-lucide-x" class="h-5 w-5" />
      </button>

      <div
        class="absolute top-12 z-10 hidden h-16 w-16 -translate-x-1/2 items-center justify-center rounded-full bg-white shadow-lg md:flex dark:bg-gray-800"
        :style="{ left: '45%' }"
      >
        <UIcon name="i-lucide-users" class="h-8 w-8 text-teal-600" />
      </div>

      <div
        class="hidden w-[45%] flex-col overflow-hidden rounded-l-2xl bg-teal-600 md:flex"
      >
        <div class="flex flex-1 flex-col items-center justify-center px-8 py-12">
          <div class="flex flex-col items-center">
            <div class="relative flex h-48 w-48 items-center justify-center">
              <UIcon
                name="i-lucide-fingerprint"
                class="h-24 w-24 text-white/70"
              />
              <div
                class="absolute -left-4 top-2 flex h-12 w-16 items-center justify-center rounded-lg bg-white/15 backdrop-blur-sm"
              >
                <UIcon name="i-lucide-id-card" class="h-7 w-7 text-white/80" />
              </div>
              <div
                class="absolute -right-4 top-2 flex h-12 w-14 items-center justify-center rounded-lg bg-white/15 backdrop-blur-sm"
              >
                <UIcon name="i-lucide-file-text" class="h-7 w-7 text-white/80" />
              </div>
              <div
                class="absolute -bottom-2 left-1/2 flex h-12 w-12 -translate-x-1/2 items-center justify-center rounded-lg bg-white/15 backdrop-blur-sm"
              >
                <UIcon
                  name="i-lucide-shield-check"
                  class="h-7 w-7 text-white/80"
                />
              </div>
            </div>
          </div>

          <h2 class="mt-10 text-2xl font-bold text-white">Selamat Datang</h2>
          <p class="mt-2 text-center text-sm leading-relaxed text-white/60">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
            eiusmod tempor incididunt ut labore.
          </p>
        </div>
      </div>

      <div
        class="flex w-full flex-col justify-center overflow-hidden rounded-r-2xl p-8 md:w-[55%] md:p-12"
      >
        <div class="mb-6 flex justify-center md:hidden ">
          <div
            class="flex h-16 w-16 items-center justify-center rounded-full bg-teal-600 shadow-lg"
          >
            <UIcon name="i-lucide-users" class="h-8 w-8 text-white" />
          </div>
        </div>

        <h1 class="text-center text-2xl font-bold text-gray-900 dark:text-gray-100">Login</h1>
        <p class="mt-1 text-center text-sm text-gray-500 dark:text-gray-400">
          Masukan informasi kredensial anda !
        </p>

        <UForm
          :schema="schema"
          :state="state"
          class="mt-6 space-y-4"
          @submit="onSubmit"
        >
          <UFormField label="Email / Username / NIS" name="identifier">
            <UInput
              v-model="state.identifier"
              class="w-full"
              placeholder="Email, username, atau NIS"
              autocomplete="username"
              size="lg"
            />
          </UFormField>

          <UFormField label="Password" name="password">
            <UInput
              v-model="state.password"
              type="password"
              class="w-full"
              autocomplete="current-password"
              size="lg"
            />
          </UFormField>

          <div class="flex items-center justify-between">
            <UCheckbox v-model="remember" label="Ingat saya" />
            <ULink
              to="/auth/forgot-password"
              class="text-sm font-medium text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300"
            >
              Lupa password ?
            </ULink>
          </div>

          <UButton type="submit" block :loading="isSubmitting" size="lg">
            Masuk
          </UButton>
        </UForm>

        <div class="my-5 flex items-center gap-3">
          <div class="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
          <span class="text-xs text-gray-400 dark:text-gray-500">atau masuk dengan</span>
          <div class="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
        </div>

        <UButton variant="outline" block size="lg" class="text-gray-700 dark:text-gray-300">
          <svg class="h-5 w-5" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Google
        </UButton>

        <p class="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
          Belum punya akun?
          <ULink
            to="/auth/register"
            class="font-medium text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300"
            >Daftar</ULink
          >
        </p>

        <div class="mt-6 text-center text-xs text-gray-400 dark:text-gray-500">
          <p>Butuh Bantuan?</p>
          <p class="mt-1">&copy; 2024</p>
        </div>
      </div>
    </div>
  </div>
</template>
