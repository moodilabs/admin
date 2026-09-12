<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import { ArrowLeft, FileText } from 'lucide-vue-next'
import { inquiriesApi } from '@/api/inquiries.api'
import { getErrorMessage } from '@/utils/error'
import { formatDateTime } from '@/utils/format'
import { inquiryStatusLabel, inquiryTopicLabel } from '@/utils/labels'
import type { InquiryDetail } from '@/types/support'
import PageHeader from '@/components/common/PageHeader.vue'
import Card from '@/components/common/Card.vue'
import Badge from '@/components/common/Badge.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import TextArea from '@/components/common/TextArea.vue'

const route = useRoute()
const router = useRouter()
const id = String(route.params.id)

const inquiry = ref<InquiryDetail | null>(null)
const answer = ref('')
const saving = ref(false)

async function load() {
  try {
    inquiry.value = await inquiriesApi.get(id)
    answer.value = inquiry.value.answer?.content ?? ''
  } catch (error) {
    toast.error(getErrorMessage(error))
    router.replace({ name: 'inquiries' })
  }
}
onMounted(load)

async function submitAnswer() {
  saving.value = true
  try {
    await inquiriesApi.answer(id, answer.value)
    toast.success('답변을 등록했습니다.')
    await load()
  } catch (error) {
    toast.error(getErrorMessage(error))
  } finally {
    saving.value = false
  }
}

const isImage = (contentType: string) => contentType.startsWith('image/')
</script>

<template>
  <button type="button" class="mb-4 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900" @click="router.push({ name: 'inquiries' })">
    <ArrowLeft class="size-4" /> 문의 목록
  </button>

  <template v-if="inquiry">
    <PageHeader :title="inquiry.subject">
      <template #actions>
        <Badge :tone="inquiry.status === 'RECEIVED' ? 'red' : 'green'">{{ inquiryStatusLabel[inquiry.status] }}</Badge>
      </template>
    </PageHeader>

    <div class="grid gap-6 lg:grid-cols-3">
      <div class="space-y-6 lg:col-span-2">
        <Card>
          <div class="mb-3 flex items-center gap-2 text-xs text-gray-500">
            <span>{{ inquiryTopicLabel[inquiry.topic] }}</span> · <span>{{ formatDateTime(inquiry.createdAt) }}</span>
          </div>
          <p class="text-sm whitespace-pre-wrap">{{ inquiry.content }}</p>
          <div v-if="inquiry.attachments.length" class="mt-4 flex flex-wrap gap-2">
            <a
              v-for="(file, i) in inquiry.attachments"
              :key="file.url"
              :href="file.url"
              target="_blank"
              rel="noopener"
              class="flex size-24 items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-gray-50"
            >
              <img v-if="isImage(file.contentType)" :src="file.url" :alt="`첨부 ${i + 1}`" class="size-full object-cover" />
              <FileText v-else class="size-8 text-gray-400" />
            </a>
          </div>
          <p v-if="inquiry.attachments.length" class="mt-1 text-xs text-gray-400">첨부 링크는 발급 후 짧게만 유효합니다. 열리지 않으면 새로고침하세요.</p>
        </Card>

        <Card>
          <h2 class="mb-3 text-sm font-semibold">답변</h2>
          <p v-if="inquiry.answer" class="mb-2 text-xs text-gray-500">
            {{ formatDateTime(inquiry.answer.answeredAt) }} 등록 · 다시 등록하면 덮어씁니다.
          </p>
          <form class="space-y-3" @submit.prevent="submitAnswer">
            <TextArea v-model="answer" :rows="10" required :maxlength="5000" placeholder="답변 내용을 입력하세요. (5,000자 이내)" />
            <div class="flex justify-end">
              <BaseButton type="submit" :loading="saving">{{ inquiry.answer ? '답변 수정' : '답변 등록' }}</BaseButton>
            </div>
          </form>
        </Card>
      </div>

      <Card class="h-fit">
        <h2 class="mb-3 text-sm font-semibold">회원</h2>
        <dl v-if="inquiry.member && !inquiry.member.withdrawn" class="space-y-2 text-sm">
          <div><dt class="text-xs text-gray-500">닉네임</dt><dd>{{ inquiry.member.nickname ?? '-' }}</dd></div>
          <div><dt class="text-xs text-gray-500">이메일</dt><dd>{{ inquiry.member.email ?? '-' }}</dd></div>
          <div>
            <dt class="text-xs text-gray-500">회원 ID</dt>
            <dd>
              <RouterLink :to="{ name: 'member-detail', params: { memberId: inquiry.member.id } }" class="font-mono text-xs text-blue-600 hover:underline">
                {{ inquiry.member.id }}
              </RouterLink>
            </dd>
          </div>
        </dl>
        <p v-else class="text-sm text-gray-400">탈퇴한 회원입니다.</p>
      </Card>
    </div>
  </template>
</template>
