<script setup lang="ts">
withDefaults(defineProps<{ rows?: number; placeholder?: string; required?: boolean; maxlength?: number; disabled?: boolean }>(), { rows: 6 })
const model = defineModel<string>({ default: '' })
</script>

<template>
  <textarea
    v-model="model"
    :rows="rows"
    :placeholder="placeholder"
    :required="required"
    :maxlength="maxlength"
    :disabled="disabled"
    class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none disabled:bg-gray-100 disabled:text-gray-500"
  />
</template>
