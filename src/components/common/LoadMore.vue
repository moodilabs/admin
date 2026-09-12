<script setup lang="ts">
import BaseButton from './BaseButton.vue'

defineProps<{ hasNext: boolean; loading: boolean }>()
const emit = defineEmits<{ more: [] }>()
</script>

<template>
  <div v-if="hasNext" class="mt-4 flex justify-center">
    <BaseButton variant="secondary" :loading="loading" @click="emit('more')">더 보기</BaseButton>
  </div>
</template>
