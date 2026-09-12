<script setup lang="ts">
import PlaceholderPage from '@/components/common/PlaceholderPage.vue'

const endpoints = [
  'GET /api/admin/faqs',
  'POST|PUT|DELETE /api/admin/faq-categories',
  'PUT /api/admin/faq-categories/order',
  'POST|PUT|DELETE /api/admin/faqs',
  'PUT /api/admin/faq-categories/{id}/faqs/order',
]
</script>

<template>
  <PlaceholderPage title="FAQ" spec="admin.md §5 · ADM-F02" :endpoints="endpoints" />
</template>
