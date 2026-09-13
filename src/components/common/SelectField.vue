<script setup lang="ts" generic="T extends string | number | boolean">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { Check, ChevronDown } from 'lucide-vue-next'

const props = defineProps<{
  options: { value: T; label: string }[]
  /** 있으면 "선택 안 함"(빈 값) 항목으로 맨 위에 노출된다. */
  placeholder?: string
  disabled?: boolean
}>()
const model = defineModel<T | ''>({ default: '' })

const open = ref(false)
const root = ref<HTMLElement | null>(null)
const highlighted = ref(-1)

const items = computed(() => [
  ...(props.placeholder ? [{ value: '' as const, label: props.placeholder }] : []),
  ...props.options,
])
const selectedLabel = computed(() => items.value.find((o) => o.value === model.value)?.label ?? props.placeholder ?? '')

function toggle() {
  if (props.disabled) return
  open.value = !open.value
  if (open.value) highlighted.value = items.value.findIndex((o) => o.value === model.value)
}
function select(value: T | '') {
  model.value = value
  open.value = false
}
function onKeydown(e: KeyboardEvent) {
  if (props.disabled) return
  if (!open.value && (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ')) {
    e.preventDefault()
    toggle()
    return
  }
  if (!open.value) return
  if (e.key === 'Escape') { open.value = false; return }
  if (e.key === 'ArrowDown') { e.preventDefault(); highlighted.value = Math.min(highlighted.value + 1, items.value.length - 1) }
  if (e.key === 'ArrowUp') { e.preventDefault(); highlighted.value = Math.max(highlighted.value - 1, 0) }
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    const item = items.value[highlighted.value]
    if (item) select(item.value)
  }
}
function onClickOutside(e: MouseEvent) {
  if (open.value && root.value && !root.value.contains(e.target as Node)) open.value = false
}
onMounted(() => document.addEventListener('mousedown', onClickOutside))
onBeforeUnmount(() => document.removeEventListener('mousedown', onClickOutside))
</script>

<template>
  <div ref="root" class="relative" @keydown="onKeydown">
    <button
      type="button"
      role="combobox"
      :aria-expanded="open"
      :disabled="disabled"
      class="flex w-full items-center justify-between gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-left text-sm whitespace-nowrap transition focus:border-gray-900 focus:outline-none disabled:bg-gray-100 disabled:text-gray-500"
      :class="open && 'border-gray-900'"
      @click="toggle"
    >
      <!-- 모든 옵션을 같은 칸에 겹쳐 그려 가장 긴 라벨 기준으로 너비를 고정한다 — 선택값이 바뀌어도 폭이 흔들리지 않는다 -->
      <span class="grid">
        <span v-for="item in items" :key="String(item.value)" class="invisible col-start-1 row-start-1" aria-hidden="true">{{ item.label }}</span>
        <span class="col-start-1 row-start-1" :class="model === '' && placeholder && 'text-gray-500'">{{ selectedLabel }}</span>
      </span>
      <ChevronDown class="size-4 shrink-0 text-gray-400 transition" :class="open && 'rotate-180'" />
    </button>

    <Transition
      enter-active-class="transition duration-100 ease-out"
      enter-from-class="scale-95 opacity-0"
      leave-active-class="transition duration-75 ease-in"
      leave-to-class="scale-95 opacity-0"
    >
      <ul
        v-if="open"
        role="listbox"
        class="absolute inset-x-0 z-20 mt-1 max-h-64 overflow-auto rounded-lg border border-gray-200 bg-white p-1 shadow-lg"
      >
        <li
          v-for="(item, i) in items"
          :key="String(item.value)"
          role="option"
          :aria-selected="item.value === model"
          class="flex cursor-pointer items-center justify-between gap-2 rounded-md px-2.5 py-1.5 text-sm whitespace-nowrap"
          :class="[
            i === highlighted ? 'bg-gray-100' : '',
            item.value === model ? 'font-medium text-gray-900' : 'text-gray-700',
          ]"
          @mouseenter="highlighted = i"
          @click="select(item.value)"
        >
          <span class="truncate">{{ item.label }}</span>
          <Check v-if="item.value === model" class="size-4 shrink-0 text-gray-900" />
        </li>
      </ul>
    </Transition>
  </div>
</template>
