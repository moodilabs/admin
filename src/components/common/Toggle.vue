<script setup lang="ts">
defineProps<{ label?: string; disabled?: boolean }>()
const model = defineModel<boolean>({ default: false })
</script>

<template>
  <label class="inline-flex cursor-pointer items-center gap-2 text-sm">
    <button
      type="button"
      role="switch"
      :aria-checked="model"
      :disabled="disabled"
      class="relative h-5 w-9 rounded-full transition disabled:opacity-50"
      :class="model ? 'bg-gray-900' : 'bg-gray-300'"
      @click="model = !model"
    >
      <span class="absolute top-0.5 size-4 rounded-full bg-white transition" :class="model ? 'left-4.5' : 'left-0.5'" />
    </button>
    <span v-if="label">{{ label }}</span>
  </label>
</template>
