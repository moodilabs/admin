<script setup lang="ts">
import PlaceholderPage from '@/components/common/PlaceholderPage.vue'

const endpoints = [
  'GET /api/admin/notices?type=&visible=&cursor=&size=',
  'PATCH /api/admin/notices/{id}/visibility',
  'DELETE /api/admin/notices/{id}',
]
</script>

<template>
  <PlaceholderPage title="공지사항" spec="admin.md §4 · ADM-F02" :endpoints="endpoints" />
</template>
