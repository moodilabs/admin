<script setup lang="ts" generic="T">
import EmptyState from './EmptyState.vue'

defineProps<{
  columns: { key: string; label: string; class?: string }[]
  rows: T[]
  rowKey: (row: T) => string | number
  loading?: boolean
  clickable?: boolean
}>()
const emit = defineEmits<{ rowClick: [row: T] }>()
</script>

<template>
  <div class="overflow-x-auto rounded-xl border border-gray-200 bg-white">
    <table class="w-full text-sm">
      <thead class="bg-gray-50 text-left text-xs font-semibold text-gray-500">
        <tr>
          <th v-for="col in columns" :key="col.key" class="px-4 py-3" :class="col.class">{{ col.label }}</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-gray-100">
        <tr v-if="loading && rows.length === 0">
          <td :colspan="columns.length" class="px-4 py-10 text-center text-gray-500">불러오는 중…</td>
        </tr>
        <tr v-else-if="rows.length === 0">
          <td :colspan="columns.length"><EmptyState /></td>
        </tr>
        <tr
          v-for="row in rows"
          :key="rowKey(row)"
          :class="clickable ? 'cursor-pointer hover:bg-gray-50' : ''"
          @click="clickable && emit('rowClick', row)"
        >
          <td v-for="col in columns" :key="col.key" class="px-4 py-3 align-middle" :class="col.class">
            <slot :name="col.key" :row="row">{{ (row as Record<string, unknown>)[col.key] }}</slot>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
