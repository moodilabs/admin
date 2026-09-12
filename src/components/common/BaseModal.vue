<script setup lang="ts">
import { X } from 'lucide-vue-next'

defineProps<{ open: boolean; title: string; wide?: boolean }>()
const emit = defineEmits<{ close: [] }>()
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" @click.self="emit('close')">
      <div class="w-full rounded-xl bg-white shadow-xl" :class="wide ? 'max-w-3xl' : 'max-w-lg'">
        <div class="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 class="text-base font-semibold">{{ title }}</h2>
          <button type="button" class="rounded p-1 text-gray-500 hover:bg-gray-100" @click="emit('close')">
            <X class="size-4" />
          </button>
        </div>
        <div class="px-6 py-5">
          <slot />
        </div>
        <div v-if="$slots.footer" class="flex justify-end gap-2 border-t border-gray-200 px-6 py-4">
          <slot name="footer" />
        </div>
      </div>
    </div>
  </Teleport>
</template>
