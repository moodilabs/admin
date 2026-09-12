import { ref, type Ref } from 'vue'
import { toast } from 'vue-sonner'
import type { CursorResponse } from '@/types/api'
import { getErrorMessage } from '@/utils/error'

/** 커서 페이징 목록 — reload()로 처음부터, loadMore()로 다음 페이지 */
export function useCursorList<T>(fetcher: (cursor?: string) => Promise<CursorResponse<T>>) {
  const items = ref([]) as Ref<T[]>
  const nextCursor = ref<string | null>(null)
  const hasNext = ref(false)
  const loading = ref(false)

  async function load(cursor?: string) {
    loading.value = true
    try {
      const page = await fetcher(cursor)
      items.value = cursor ? [...items.value, ...page.items] : page.items
      nextCursor.value = page.nextCursor
      hasNext.value = page.hasNext
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      loading.value = false
    }
  }

  const reload = () => load()
  const loadMore = () => (nextCursor.value ? load(nextCursor.value) : Promise.resolve())

  return { items, hasNext, loading, reload, loadMore }
}
