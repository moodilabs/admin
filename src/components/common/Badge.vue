<script setup lang="ts">
withDefaults(defineProps<{ tone?: 'gray' | 'green' | 'yellow' | 'red' | 'blue' }>(), { tone: 'gray' })

const tones = {
  gray: 'bg-gray-100 text-gray-700',
  green: 'bg-green-100 text-green-700',
  yellow: 'bg-yellow-100 text-yellow-800',
  red: 'bg-red-100 text-red-700',
  blue: 'bg-blue-100 text-blue-700',
}
</script>

<template>
  <span class="inline-flex rounded-full px-2 py-0.5 text-xs font-medium" :class="tones[tone]">
    <slot />
  </span>
</template>
