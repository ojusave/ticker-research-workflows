/** US Eastern calendar dates for market-oriented research. */
export function researchDates() {
  const today = formatIsoDateEt(new Date())
  const yesterday = formatIsoDateEt(addDays(new Date(), -1))
  const threeDaysAgo = formatIsoDateEt(addDays(new Date(), -3))

  return {
    today,
    todayLabel: formatLongDate(today),
    priceSince: yesterday,
    newsSince: today,
    commentarySince: threeDaysAgo,
  }
}

function addDays(d: Date, days: number): Date {
  const next = new Date(d)
  next.setDate(next.getDate() + days)
  return next
}

function formatIsoDateEt(d: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d)
}

function formatLongDate(iso: string): string {
  const [y, m, day] = iso.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, day)).toLocaleDateString('en-US', {
    timeZone: 'UTC',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}
