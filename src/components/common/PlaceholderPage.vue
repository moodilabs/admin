<script setup lang="ts">
import PageHeader from './PageHeader.vue'
import Card from './Card.vue'

defineProps<{ title: string; spec: string; endpoints: string[] }>()
</script>

<template>
  <PageHeader :title="title" :description="`구현 예정 · ${spec}`" />
  <Card>
    <p class="mb-3 text-sm font-medium text-gray-700">연동할 API</p>
    <ul class="space-y-1 font-mono text-xs text-gray-600">
      <li v-for="e in endpoints" :key="e">{{ e }}</li>
    </ul>
  </Card>
</template>
