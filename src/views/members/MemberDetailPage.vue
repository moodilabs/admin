<script setup lang="ts">
import PlaceholderPage from '@/components/common/PlaceholderPage.vue'

const endpoints = [
  'GET /api/admin/members/{memberId}',
  'PATCH /api/admin/members/{memberId}/status (SUPER)',
  'POST /api/admin/members/{memberId}/withdrawal (SUPER)',
]
</script>

<template>
  <PlaceholderPage title="회원 상세" spec="admin.md §3 · ADM-F04" :endpoints="endpoints" />
</template>
