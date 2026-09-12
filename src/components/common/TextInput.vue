<script setup lang="ts">
withDefaults(defineProps<{
  type?: string
  placeholder?: string
  required?: boolean
  maxlength?: number
  minlength?: number
  disabled?: boolean
  autocomplete?: string
}>(), { type: 'text' })
const model = defineModel<string>({ default: '' })
</script>

<template>
  <input
    v-model="model"
    :type="type"
    :placeholder="placeholder"
    :required="required"
    :maxlength="maxlength"
    :minlength="minlength"
    :disabled="disabled"
    :autocomplete="autocomplete"
    class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none disabled:bg-gray-100 disabled:text-gray-500"
  />
</template>
