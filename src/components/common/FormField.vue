<script setup lang="ts">
defineProps<{ label: string; hint?: string; required?: boolean }>()
</script>

<template>
  <label class="block space-y-1">
    <span class="text-sm font-medium">
      {{ label }}<span v-if="required" class="text-red-500"> *</span>
    </span>
    <slot />
    <span v-if="hint" class="block text-xs text-gray-500">{{ hint }}</span>
  </label>
</template>
