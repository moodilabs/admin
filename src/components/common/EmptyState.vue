<script setup lang="ts">
defineProps<{ message?: string }>()
</script>

<template>
  <div class="py-16 text-center text-sm text-gray-500">
    {{ message ?? '데이터가 없습니다.' }}
  </div>
</template>
