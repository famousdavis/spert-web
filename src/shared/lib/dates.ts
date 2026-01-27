// Date utility functions

/**
 * Add days to a date string and return a new ISO date string
 */
export function addDays(dateStr: string, days: number): string {
  const date = new Date(dateStr)
  date.setDate(date.getDate() + days)
  return date.toISOString().split('T')[0]
}

/**
 * Add weeks to a date string and return a new ISO date string
 */
export function addWeeks(dateStr: string, weeks: number): string {
  return addDays(dateStr, weeks * 7)
}

/**
 * Format a date string for display (e.g., "Jan 15, 2026")
 * Uses T00:00:00 suffix to avoid timezone issues with date-only strings
 */
export function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00')
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

/**
 * Format a date string without year (e.g., "Jan 15")
 * Useful for compact chart labels where year is implied
 */
export function formatDateCompact(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00')
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${months[date.getMonth()]} ${date.getDate()}`
}

/**
 * Get today's date as an ISO date string (YYYY-MM-DD)
 */
export function today(): string {
  return new Date().toISOString().split('T')[0]
}

/**
 * Parse an ISO date string and return a Date object
 */
export function parseDate(dateStr: string): Date {
  return new Date(dateStr)
}

/**
 * Calculate the number of days between two dates
 */
export function daysBetween(startDateStr: string, endDateStr: string): number {
  const start = new Date(startDateStr)
  const end = new Date(endDateStr)
  const diffTime = end.getTime() - start.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

/**
 * Check if a date is a weekend (Saturday = 6, Sunday = 0)
 */
export function isWeekend(dateStr: string): boolean {
  const date = new Date(dateStr + 'T00:00:00')
  const day = date.getDay()
  return day === 0 || day === 6
}

/**
 * Get the preceding business day (Mon-Fri) for a given date.
 * If the date is already a business day, returns that date.
 * If it's Saturday, returns Friday. If it's Sunday, returns Friday.
 */
export function getPrecedingBusinessDay(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00')
  const day = date.getDay()

  if (day === 0) {
    // Sunday -> Friday (subtract 2 days)
    return addDays(dateStr, -2)
  } else if (day === 6) {
    // Saturday -> Friday (subtract 1 day)
    return addDays(dateStr, -1)
  }
  // Already a business day
  return dateStr
}

/**
 * Calculate the sprint start date for a given sprint number
 * Sprint 1 starts on firstSprintStartDate
 * Sprint N starts on firstSprintStartDate + (N-1) * cadenceWeeks
 */
export function calculateSprintStartDate(
  firstSprintStartDate: string,
  sprintNumber: number,
  cadenceWeeks: number
): string {
  const weeksToAdd = (sprintNumber - 1) * cadenceWeeks
  return addWeeks(firstSprintStartDate, weeksToAdd)
}

/**
 * Calculate the sprint finish date for a given sprint start date and cadence.
 * The finish date is the business day (Mon-Fri) immediately before the next sprint starts.
 */
export function calculateSprintFinishDate(
  sprintStartDate: string,
  cadenceWeeks: number
): string {
  // Next sprint would start on sprintStartDate + cadenceWeeks
  const nextSprintStart = addWeeks(sprintStartDate, cadenceWeeks)
  // Day before next sprint starts
  const dayBeforeNextSprint = addDays(nextSprintStart, -1)
  // Ensure it's a business day
  return getPrecedingBusinessDay(dayBeforeNextSprint)
}

/**
 * Check if a date string is valid and within the allowed year range (2000-2050)
 * @param allowEmpty - If true, returns true for empty/incomplete strings (useful for form validation)
 */
export function isValidDateRange(dateStr: string, allowEmpty = false): boolean {
  if (!dateStr || dateStr.length !== 10) return allowEmpty
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false
  return dateStr >= '2000-01-01' && dateStr <= '2050-12-31'
}

/**
 * Format a date range for sprint display (e.g., "January 20 - 31" or "January 20 - February 3")
 */
export function formatDateRange(startDate: string, finishDate: string): string {
  const start = new Date(startDate + 'T00:00:00')
  const end = new Date(finishDate + 'T00:00:00')

  const startMonth = start.toLocaleDateString('en-US', { month: 'long' })
  const startDay = start.getDate()
  const endMonth = end.toLocaleDateString('en-US', { month: 'long' })
  const endDay = end.getDate()

  // If same month, don't repeat month name
  if (startMonth === endMonth) {
    return `${startMonth} ${startDay} - ${endDay}`
  }
  return `${startMonth} ${startDay} - ${endMonth} ${endDay}`
}
