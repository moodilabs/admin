<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import { noticesApi } from '@/api/notices.api'
import { useCursorList } from '@/composables/useCursorList'
import { getErrorMessage } from '@/utils/error'
import { formatDate } from '@/utils/format'
import { noticeTypeLabel, toOptions } from '@/utils/labels'
import type { Notice, NoticeType } from '@/types/support'
import PageHeader from '@/components/common/PageHeader.vue'
import DataTable from '@/components/common/DataTable.vue'
import Badge from '@/components/common/Badge.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import SelectField from '@/components/common/SelectField.vue'
import LoadMore from '@/components/common/LoadMore.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'

const router = useRouter()
const type = ref<NoticeType | ''>('')
const visible = ref<boolean | ''>('')

const list = useCursorList<Notice>((cursor) =>
  noticesApi.list({
    type: type.value || undefined,
    visible: visible.value === '' ? undefined : visible.value,
    cursor,
    size: 20,
  }),
)

onMounted(list.reload)
watch([type, visible], list.reload)

const columns = [
  { key: 'type', label: '유형', class: 'w-24' },
  { key: 'title', label: '제목' },
  { key: 'visible', label: '노출', class: 'w-20' },
  { key: 'publishedAt', label: '게시일', class: 'w-32' },
  { key: 'actions', label: '', class: 'w-40 text-right' },
]

async function toggleVisible(notice: Notice) {
  try {
    await noticesApi.updateVisibility(notice.id, !notice.visible)
    notice.visible = !notice.visible
    toast.success(notice.visible ? '노출로 변경했습니다.' : '숨김으로 변경했습니다.')
  } catch (error) {
    toast.error(getErrorMessage(error))
  }
}

const deleteTarget = ref<Notice | null>(null)
const deleting = ref(false)
async function confirmDelete() {
  if (!deleteTarget.value) return
  deleting.value = true
  try {
    await noticesApi.remove(deleteTarget.value.id)
    toast.success('공지를 삭제했습니다.')
    deleteTarget.value = null
    await list.reload()
  } catch (error) {
    toast.error(getErrorMessage(error))
  } finally {
    deleting.value = false
  }
}
</script>

<template>
  <PageHeader title="공지사항" description="MY-04 · 앱 마이페이지 공지 목록에 노출됩니다.">
    <template #actions>
      <BaseButton @click="router.push({ name: 'notice-new' })">공지 등록</BaseButton>
    </template>
  </PageHeader>

  <div class="mb-4 flex gap-2">
    <SelectField v-model="type" :options="toOptions(noticeTypeLabel)" placeholder="전체 유형" />
    <SelectField v-model="visible" :options="[{ value: true, label: '노출' }, { value: false, label: '숨김' }]" placeholder="노출 전체" />
  </div>

  <DataTable
    :columns="columns"
    :rows="list.items.value"
    :row-key="(r) => r.id"
    :loading="list.loading.value"
    clickable
    @row-click="(r) => router.push({ name: 'notice-edit', params: { id: r.id } })"
  >
    <template #type="{ row }"><Badge tone="blue">{{ noticeTypeLabel[row.type] }}</Badge></template>
    <template #visible="{ row }">
      <Badge :tone="row.visible ? 'green' : 'gray'">{{ row.visible ? '노출' : '숨김' }}</Badge>
    </template>
    <template #publishedAt="{ row }">{{ formatDate(row.publishedAt) }}</template>
    <template #actions="{ row }">
      <div class="flex justify-end gap-1" @click.stop>
        <BaseButton variant="secondary" class="!px-3 !py-1" @click="toggleVisible(row)">
          {{ row.visible ? '숨기기' : '노출' }}
        </BaseButton>
        <BaseButton variant="danger" class="!px-3 !py-1" @click="deleteTarget = row">삭제</BaseButton>
      </div>
    </template>
  </DataTable>
  <LoadMore :has-next="list.hasNext.value" :loading="list.loading.value" @more="list.loadMore" />

  <ConfirmDialog
    :open="deleteTarget !== null"
    title="공지 삭제"
    :message="`'${deleteTarget?.title}' 공지를 삭제합니다. 삭제된 공지는 복구할 수 없습니다.`"
    confirm-label="삭제"
    danger
    :loading="deleting"
    @confirm="confirmDelete"
    @cancel="deleteTarget = null"
  />
</template>
