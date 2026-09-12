<script setup lang="ts" generic="T extends string | number | boolean">
defineProps<{
  options: { value: T; label: string }[]
  placeholder?: string
  disabled?: boolean
}>()
const model = defineModel<T | ''>({ default: '' })
</script>

<template>
  <select
    v-model="model"
    :disabled="disabled"
    class="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-gray-900 focus:outline-none disabled:bg-gray-100"
  >
    <option v-if="placeholder" value="">{{ placeholder }}</option>
    <option v-for="opt in options" :key="String(opt.value)" :value="opt.value">{{ opt.label }}</option>
  </select>
</template>
