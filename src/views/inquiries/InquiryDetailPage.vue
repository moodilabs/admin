<script setup lang="ts">
import PlaceholderPage from '@/components/common/PlaceholderPage.vue'

const endpoints = [
  'GET /api/admin/inquiries/{id}',
  'PUT /api/admin/inquiries/{id}/answer',
]
</script>

<template>
  <PlaceholderPage title="문의 상세" spec="admin.md §7 · ADM-F03" :endpoints="endpoints" />
</template>
