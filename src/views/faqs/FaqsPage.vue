<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { toast } from 'vue-sonner'
import { ChevronDown, ChevronUp, Pencil, Trash2, Plus } from 'lucide-vue-next'
import { faqsApi } from '@/api/faqs.api'
import { getErrorCode, getErrorMessage } from '@/utils/error'
import type { FaqItem, FaqCategory, FaqCategoryRequest, FaqRequest } from '@/types/support'
import PageHeader from '@/components/common/PageHeader.vue'
import Card from '@/components/common/Card.vue'
import Badge from '@/components/common/Badge.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseModal from '@/components/common/BaseModal.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import FormField from '@/components/common/FormField.vue'
import TextInput from '@/components/common/TextInput.vue'
import TextArea from '@/components/common/TextArea.vue'
import SelectField from '@/components/common/SelectField.vue'
import Toggle from '@/components/common/Toggle.vue'
import EmptyState from '@/components/common/EmptyState.vue'

const categories = ref<FaqCategory[]>([])
const loading = ref(false)

async function load() {
  loading.value = true
  try {
    categories.value = await faqsApi.listAll()
  } catch (error) {
    toast.error(getErrorMessage(error))
  } finally {
    loading.value = false
  }
}
onMounted(load)

async function run(action: () => Promise<unknown>, successMessage: string) {
  try {
    await action()
    toast.success(successMessage)
    await load()
    return true
  } catch (error) {
    if (getErrorCode(error) === 'FAQ_CATEGORY_NOT_EMPTY') {
      toast.error('항목이 남아 있는 카테고리는 삭제할 수 없습니다. 항목을 먼저 삭제하거나 이동하세요.')
    } else {
      toast.error(getErrorMessage(error))
    }
    return false
  }
}

// ── 순서 이동 (전체 ID 배열을 sort_order=index 로 교체) ──
function swap<T>(arr: T[], i: number, j: number) {
  const copy = [...arr]
  ;[copy[i], copy[j]] = [copy[j]!, copy[i]!]
  return copy
}
function moveCategory(index: number, dir: -1 | 1) {
  const target = index + dir
  if (target < 0 || target >= categories.value.length) return
  const ids = swap(categories.value, index, target).map((c) => c.id)
  run(() => faqsApi.reorderCategories(ids), '카테고리 순서를 변경했습니다.')
}
function moveFaq(category: FaqCategory, index: number, dir: -1 | 1) {
  const target = index + dir
  if (target < 0 || target >= category.items.length) return
  const ids = swap(category.items, index, target).map((f) => f.id)
  run(() => faqsApi.reorder(category.id, ids), '항목 순서를 변경했습니다.')
}

// ── 카테고리 모달 ──
const categoryModal = reactive<{ open: boolean; id: number | null; form: FaqCategoryRequest }>({
  open: false, id: null, form: { name: '', visible: true },
})
const categorySaving = ref(false)
function openCategory(category?: FaqCategory) {
  categoryModal.id = category?.id ?? null
  categoryModal.form = { name: category?.name ?? '', visible: category?.visible ?? true }
  categoryModal.open = true
}
async function submitCategory() {
  categorySaving.value = true
  const body = { ...categoryModal.form }
  const ok = categoryModal.id === null
    ? await run(() => faqsApi.createCategory(body), '카테고리를 추가했습니다.')
    : await run(() => faqsApi.updateCategory(categoryModal.id!, body), '카테고리를 수정했습니다.')
  categorySaving.value = false
  if (ok) categoryModal.open = false
}

// ── 항목 모달 ──
const faqModal = reactive<{ open: boolean; id: number | null; form: FaqRequest }>({
  open: false, id: null, form: { categoryId: 0, question: '', answer: '', visible: true },
})
const faqSaving = ref(false)
function openFaq(categoryId: number, faq?: FaqItem) {
  faqModal.id = faq?.id ?? null
  faqModal.form = {
    categoryId,
    question: faq?.question ?? '',
    answer: faq?.answer ?? '',
    visible: faq?.visible ?? true,
  }
  faqModal.open = true
}
async function submitFaq() {
  faqSaving.value = true
  const body = { ...faqModal.form }
  const ok = faqModal.id === null
    ? await run(() => faqsApi.create(body), 'FAQ를 추가했습니다.')
    : await run(() => faqsApi.update(faqModal.id!, body), 'FAQ를 수정했습니다.')
  faqSaving.value = false
  if (ok) faqModal.open = false
}

// ── 삭제 ──
const deleteTarget = ref<{ kind: 'category'; item: FaqCategory } | { kind: 'faq'; item: FaqItem } | null>(null)
const deleting = ref(false)
async function confirmDelete() {
  const target = deleteTarget.value
  if (!target) return
  deleting.value = true
  const ok = target.kind === 'category'
    ? await run(() => faqsApi.removeCategory(target.item.id), '카테고리를 삭제했습니다.')
    : await run(() => faqsApi.remove(target.item.id), 'FAQ를 삭제했습니다.')
  deleting.value = false
  if (ok) deleteTarget.value = null
}

const collapsed = reactive(new Set<number>())
</script>

<template>
  <PageHeader title="FAQ" description="MY-05 · 카테고리와 항목의 순서가 앱에 그대로 반영됩니다.">
    <template #actions>
      <BaseButton @click="openCategory()">카테고리 추가</BaseButton>
    </template>
  </PageHeader>

  <div v-if="loading && categories.length === 0" class="text-sm text-gray-500">불러오는 중…</div>
  <EmptyState v-else-if="categories.length === 0" message="카테고리가 없습니다. 먼저 카테고리를 추가하세요." />

  <div v-else class="space-y-4">
    <Card v-for="(category, ci) in categories" :key="category.id" class="!p-0">
      <div class="flex items-center gap-3 px-5 py-3">
        <button type="button" class="text-gray-400 hover:text-gray-700" @click="collapsed.has(category.id) ? collapsed.delete(category.id) : collapsed.add(category.id)">
          <ChevronDown v-if="!collapsed.has(category.id)" class="size-4" />
          <ChevronUp v-else class="size-4" />
        </button>
        <span class="font-semibold">{{ category.name }}</span>
        <Badge :tone="category.visible ? 'green' : 'gray'">{{ category.visible ? '노출' : '숨김' }}</Badge>
        <span class="text-xs text-gray-400">{{ category.items.length }}개</span>
        <div class="ml-auto flex items-center gap-1">
          <button type="button" class="rounded p-1.5 text-gray-500 hover:bg-gray-100 disabled:opacity-30" :disabled="ci === 0" @click="moveCategory(ci, -1)"><ChevronUp class="size-4" /></button>
          <button type="button" class="rounded p-1.5 text-gray-500 hover:bg-gray-100 disabled:opacity-30" :disabled="ci === categories.length - 1" @click="moveCategory(ci, 1)"><ChevronDown class="size-4" /></button>
          <button type="button" class="rounded p-1.5 text-gray-500 hover:bg-gray-100" @click="openFaq(category.id)"><Plus class="size-4" /></button>
          <button type="button" class="rounded p-1.5 text-gray-500 hover:bg-gray-100" @click="openCategory(category)"><Pencil class="size-4" /></button>
          <button type="button" class="rounded p-1.5 text-red-500 hover:bg-red-50" @click="deleteTarget = { kind: 'category', item: category }"><Trash2 class="size-4" /></button>
        </div>
      </div>

      <ul v-if="!collapsed.has(category.id)" class="divide-y divide-gray-100 border-t border-gray-200">
        <li v-if="category.items.length === 0" class="px-5 py-4 text-sm text-gray-400">항목이 없습니다.</li>
        <li v-for="(faq, fi) in category.items" :key="faq.id" class="flex items-start gap-3 px-5 py-3">
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2">
              <span class="truncate text-sm font-medium">{{ faq.question }}</span>
              <Badge v-if="!faq.visible" tone="gray">숨김</Badge>
            </div>
            <p class="mt-1 line-clamp-2 text-xs whitespace-pre-line text-gray-500">{{ faq.answer }}</p>
          </div>
          <div class="flex shrink-0 items-center gap-1">
            <button type="button" class="rounded p-1.5 text-gray-500 hover:bg-gray-100 disabled:opacity-30" :disabled="fi === 0" @click="moveFaq(category, fi, -1)"><ChevronUp class="size-4" /></button>
            <button type="button" class="rounded p-1.5 text-gray-500 hover:bg-gray-100 disabled:opacity-30" :disabled="fi === category.items.length - 1" @click="moveFaq(category, fi, 1)"><ChevronDown class="size-4" /></button>
            <button type="button" class="rounded p-1.5 text-gray-500 hover:bg-gray-100" @click="openFaq(category.id, faq)"><Pencil class="size-4" /></button>
            <button type="button" class="rounded p-1.5 text-red-500 hover:bg-red-50" @click="deleteTarget = { kind: 'faq', item: faq }"><Trash2 class="size-4" /></button>
          </div>
        </li>
      </ul>
    </Card>
  </div>

  <BaseModal :open="categoryModal.open" :title="categoryModal.id === null ? '카테고리 추가' : '카테고리 수정'" @close="categoryModal.open = false">
    <form id="category-form" class="space-y-4" @submit.prevent="submitCategory">
      <FormField label="이름" required>
        <TextInput v-model="categoryModal.form.name" required :maxlength="50" />
      </FormField>
      <Toggle v-model="categoryModal.form.visible" label="앱에 노출" />
    </form>
    <template #footer>
      <BaseButton variant="secondary" @click="categoryModal.open = false">취소</BaseButton>
      <BaseButton type="submit" form="category-form" :loading="categorySaving">저장</BaseButton>
    </template>
  </BaseModal>

  <BaseModal :open="faqModal.open" :title="faqModal.id === null ? 'FAQ 추가' : 'FAQ 수정'" wide @close="faqModal.open = false">
    <form id="faq-form" class="space-y-4" @submit.prevent="submitFaq">
      <FormField label="카테고리" required>
        <SelectField v-model="faqModal.form.categoryId" :options="categories.map((c) => ({ value: c.id, label: c.name }))" class="w-full" />
      </FormField>
      <FormField label="질문" required>
        <TextInput v-model="faqModal.form.question" required :maxlength="200" />
      </FormField>
      <FormField label="답변" required>
        <TextArea v-model="faqModal.form.answer" required :rows="8" :maxlength="10000" />
      </FormField>
      <Toggle v-model="faqModal.form.visible" label="앱에 노출" />
    </form>
    <template #footer>
      <BaseButton variant="secondary" @click="faqModal.open = false">취소</BaseButton>
      <BaseButton type="submit" form="faq-form" :loading="faqSaving">저장</BaseButton>
    </template>
  </BaseModal>

  <ConfirmDialog
    :open="deleteTarget !== null"
    :title="deleteTarget?.kind === 'category' ? '카테고리 삭제' : 'FAQ 삭제'"
    :message="deleteTarget?.kind === 'category'
      ? `'${deleteTarget.item.name}' 카테고리를 삭제합니다. 항목이 남아 있으면 삭제할 수 없습니다.`
      : `'${deleteTarget?.item.question}' 항목을 삭제합니다.`"
    confirm-label="삭제"
    danger
    :loading="deleting"
    @confirm="confirmDelete"
    @cancel="deleteTarget = null"
  />
</template>
