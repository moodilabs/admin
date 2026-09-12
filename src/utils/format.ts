const dateTimeFormatter = new Intl.DateTimeFormat('ko-KR', {
  year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', hour12: false,
})

const dateFormatter = new Intl.DateTimeFormat('ko-KR', {
  year: 'numeric', month: '2-digit', day: '2-digit',
})

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return '-'
  return dateTimeFormatter.format(new Date(value))
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return '-'
  return dateFormatter.format(new Date(value))
}

export function formatNumber(value: number): string {
  return value.toLocaleString('ko-KR')
}
