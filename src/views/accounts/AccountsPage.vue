<script setup lang="ts">
import PlaceholderPage from '@/components/common/PlaceholderPage.vue'

const endpoints = [
  'GET /api/admin/accounts',
  'POST /api/admin/accounts',
  'PATCH /api/admin/accounts/{id}/status',
]
</script>

<template>
  <PlaceholderPage title="관리자 계정" spec="admin.md §2 · ADM-F01 (SUPER)" :endpoints="endpoints" />
</template>
