export interface Dashboard {
  members: {
    total: number
    active: number
    pending: number
    suspended: number
    withdrawn: number
    newToday: number
    newLast7Days: number
  }
  content: {
    spots: number
    bookmarks: number
    routes: number
    sharedRoutes: number
    picks: number
  }
  inquiries: {
    received: number
    answeredLast7Days: number
  }
  withdrawalReasonsLast30Days: Record<string, number>
}
