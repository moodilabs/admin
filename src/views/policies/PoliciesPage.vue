<script setup lang="ts">
import PlaceholderPage from '@/components/common/PlaceholderPage.vue'

const endpoints = [
  'GET /api/admin/policies?type=',
  'DELETE /api/admin/policies/{id} (시행 전만)',
]
</script>

<template>
  <PlaceholderPage title="약관 관리" spec="admin.md §6 · ADM-F02" :endpoints="endpoints" />
</template>
