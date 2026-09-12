<script setup lang="ts">
withDefaults(defineProps<{
  variant?: 'primary' | 'secondary' | 'danger'
  type?: 'button' | 'submit'
  disabled?: boolean
  loading?: boolean
}>(), { variant: 'primary', type: 'button' })

const variants = {
  primary: 'bg-gray-900 text-white hover:bg-gray-700',
  secondary: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50',
  danger: 'bg-red-600 text-white hover:bg-red-500',
}
</script>

<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    class="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50"
    :class="variants[variant]"
  >
    <span v-if="loading" class="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
    <slot />
  </button>
</template>
