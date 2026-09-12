<script setup lang="ts">
import BaseModal from './BaseModal.vue'
import BaseButton from './BaseButton.vue'

withDefaults(defineProps<{
  open: boolean
  title: string
  message?: string
  confirmLabel?: string
  danger?: boolean
  loading?: boolean
}>(), { confirmLabel: '확인' })
const emit = defineEmits<{ confirm: []; cancel: [] }>()
</script>

<template>
  <BaseModal :open="open" :title="title" @close="emit('cancel')">
    <p v-if="message" class="text-sm text-gray-600">{{ message }}</p>
    <slot />
    <template #footer>
      <BaseButton variant="secondary" @click="emit('cancel')">취소</BaseButton>
      <BaseButton :variant="danger ? 'danger' : 'primary'" :loading="loading" @click="emit('confirm')">{{ confirmLabel }}</BaseButton>
    </template>
  </BaseModal>
</template>
