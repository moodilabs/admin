<script setup lang="ts">
defineProps<{ title: string }>()
</script>

<template>
  <div class="mb-6 flex items-start justify-between gap-4">
    <h1 class="text-2xl font-bold tracking-tight">{{ title }}</h1>
    <div class="flex items-center gap-2">
      <slot name="actions" />
    </div>
  </div>
</template>
