<template>
  <div class="flex min-h-screen items-center justify-center bg-muted/40 px-4 py-12">
    <div class="w-full max-w-sm">
      <div class="mb-6 flex flex-col items-center gap-2">
        <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-lg font-bold text-inverted">
          S
        </div>
        <h1 class="text-lg font-semibold">Sipon</h1>
      </div>
      <slot />
    </div>
  </div>
</template>
