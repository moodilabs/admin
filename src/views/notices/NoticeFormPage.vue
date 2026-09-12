<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import { noticesApi } from '@/api/notices.api'
import { getErrorMessage } from '@/utils/error'
import { toDateInput } from '@/utils/format'
import { noticeTypeLabel, toOptions } from '@/utils/labels'
import type { NoticeRequest } from '@/types/support'
import PageHeader from '@/components/common/PageHeader.vue'
import Card from '@/components/common/Card.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import FormField from '@/components/common/FormField.vue'
import TextInput from '@/components/common/TextInput.vue'
import TextArea from '@/components/common/TextArea.vue'
import SelectField from '@/components/common/SelectField.vue'
import Toggle from '@/components/common/Toggle.vue'

const route = useRoute()
const router = useRouter()
const id = computed(() => (route.params.id ? Number(route.params.id) : null))
const isEdit = computed(() => id.value !== null)

const form = reactive<NoticeRequest>({ type: 'ANNOUNCEMENT', title: '', content: '', visible: true, publishedAt: toDateInput() })
const loading = ref(false)
const saving = ref(false)

onMounted(async () => {
  if (!isEdit.value) return
  loading.value = true
  try {
    const notice = await noticesApi.get(id.value!)
    Object.assign(form, {
      type: notice.type,
      title: notice.title,
      content: notice.content,
      visible: notice.visible,
      publishedAt: notice.publishedAt.slice(0, 10),
    })
  } catch (error) {
    toast.error(getErrorMessage(error))
    router.replace({ name: 'notices' })
  } finally {
    loading.value = false
  }
})

async function submit() {
  saving.value = true
  try {
    if (isEdit.value) {
      await noticesApi.update(id.value!, { ...form })
      toast.success('공지를 수정했습니다.')
    } else {
      await noticesApi.create({ ...form })
      toast.success('공지를 등록했습니다.')
    }
    router.push({ name: 'notices' })
  } catch (error) {
    toast.error(getErrorMessage(error))
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <PageHeader :title="isEdit ? '공지 수정' : '공지 등록'" />

  <Card class="max-w-3xl">
    <form v-if="!loading" class="space-y-5" @submit.prevent="submit">
      <div class="grid grid-cols-2 gap-4">
        <FormField label="유형" required>
          <SelectField v-model="form.type" :options="toOptions(noticeTypeLabel)" class="w-full" />
        </FormField>
        <FormField label="게시일" required hint="미지정 시 오늘">
          <TextInput v-model="form.publishedAt" type="date" required />
        </FormField>
      </div>
      <FormField label="제목" required hint="100자 이내">
        <TextInput v-model="form.title" required :maxlength="100" />
      </FormField>
      <FormField label="내용" required hint="10,000자 이내">
        <TextArea v-model="form.content" required :maxlength="10000" :rows="14" />
      </FormField>
      <Toggle v-model="form.visible" label="앱에 노출" />
      <div class="flex justify-end gap-2 pt-2">
        <BaseButton variant="secondary" @click="router.back()">취소</BaseButton>
        <BaseButton type="submit" :loading="saving">{{ isEdit ? '수정' : '등록' }}</BaseButton>
      </div>
    </form>
    <div v-else class="text-sm text-gray-500">불러오는 중…</div>
  </Card>
</template>
