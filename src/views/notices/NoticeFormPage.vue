<script setup lang="ts">
import PlaceholderPage from '@/components/common/PlaceholderPage.vue'

const endpoints = [
  'GET /api/admin/notices/{id}',
  'POST /api/admin/notices',
  'PUT /api/admin/notices/{id}',
]
</script>

<template>
  <PlaceholderPage title="공지 등록/수정" spec="admin.md §4 · ADM-F02" :endpoints="endpoints" />
</template>
