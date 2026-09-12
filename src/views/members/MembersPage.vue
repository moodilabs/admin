<script setup lang="ts">
import PlaceholderPage from '@/components/common/PlaceholderPage.vue'

const endpoints = [
  'GET /api/admin/members?keyword=&status=&provider=&cursor=&size=',
  'GET /api/admin/members/stats?from=&to=',
]
</script>

<template>
  <PlaceholderPage title="회원 관리" spec="admin.md §3 · ADM-F04" :endpoints="endpoints" />
</template>
