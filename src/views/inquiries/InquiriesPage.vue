<script setup lang="ts">
import PlaceholderPage from '@/components/common/PlaceholderPage.vue'

const endpoints = [
  'GET /api/admin/inquiries?status=&topic=&cursor=&size=',
  'GET /api/admin/inquiries/count?status=RECEIVED',
]
</script>

<template>
  <PlaceholderPage title="1:1 문의" spec="admin.md §7 · ADM-F03" :endpoints="endpoints" />
</template>
