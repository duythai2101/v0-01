/**
 * Convert current UTC time to Vietnam timezone (UTC+7) using Intl API
 * Fallbacks to manual offset if Intl fails
 * @returns Current time in Vietnam timezone as a valid Date object
 */
export const getCurrentVietnamTime = (): Date => {
  try {
    const now = new Date()

    const formatter = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Ho_Chi_Minh",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    })

    const parts = formatter.formatToParts(now)
    const get = (type: string) => parts.find((p) => p.type === type)?.value.padStart(2, "0")

    const yyyy = get("year")
    const MM = get("month")
    const dd = get("day")
    const hh = get("hour")
    const mm = get("minute")
    const ss = get("second")

    if (!yyyy || !MM || !dd || !hh || !mm || !ss) {
      throw new Error("Incomplete date parts")
    }

    const isoString = `${yyyy}-${MM}-${dd}T${hh}:${mm}:${ss}`
    return new Date(isoString)
  } catch (error) {
    console.warn("[TimeUtils] Intl failed, fallback to manual UTC+7 offset", error)
    const utc = new Date()
    return new Date(utc.getTime() + 7 * 60 * 60 * 1000)
  }
}

/**
 * Get time string in HH:MM format from Date
 * @param date Date object
 * @returns Time string in HH:MM format
 */
export const getTimeString = (date: Date): string => {
  const hours = date.getHours().toString().padStart(2, "0")
  const minutes = date.getMinutes().toString().padStart(2, "0")
  return `${hours}:${minutes}`
}

/**
 * Format Date to yyyy-mm-dd
 * @param date Date object
 * @returns String in format YYYY-MM-DD
 */
export const formatDate = (date: Date): string => {
  const yyyy = date.getFullYear()
  const mm = (date.getMonth() + 1).toString().padStart(2, "0")
  const dd = date.getDate().toString().padStart(2, "0")
  return `${yyyy}-${mm}-${dd}`
}

/**
 * Check if current Vietnam time matches target time within a tolerance
 * @param targetTime Time string in HH:MM format
 * @param toleranceMinutes Allowed tolerance in minutes (default: 5)
 * @returns True if matches within tolerance, false otherwise
 */
export const isTimeMatch = (targetTime: string, toleranceMinutes = 5): boolean => {
  const vietnamTime = getCurrentVietnamTime()
  const currentTimeString = getTimeString(vietnamTime)

  if (currentTimeString === targetTime) return true

  const [targetHour, targetMinute] = targetTime.split(":").map(Number)
  const [currentHour, currentMinute] = currentTimeString.split(":").map(Number)

  const targetTotal = targetHour * 60 + targetMinute
  const currentTotal = currentHour * 60 + currentMinute
  const diff = Math.abs(targetTotal - currentTotal)

  return diff <= toleranceMinutes
}

/**
 * Get the next scheduled run time for a given time
 * @param timeString Time string in HH:MM format
 * @returns Date object representing the next run time
 */
export const getNextRunTime = (timeString: string): Date => {
  const now = getCurrentVietnamTime()
  const [targetHours, targetMinutes] = timeString.split(":").map(Number)

  const nextRun = new Date(now)
  nextRun.setHours(targetHours, targetMinutes, 0, 0)

  // If the time has already passed today, schedule for tomorrow
  if (nextRun <= now) {
    nextRun.setDate(nextRun.getDate() + 1)
  }

  return nextRun
}

/**
 * Convert a time string to a cron expression for Vietnam timezone
 * @param timeString Time string in HH:MM format (Vietnam time)
 * @returns Cron expression for UTC time
 */
export const convertVietnamTimeToCron = (timeString: string): string => {
  const [hours, minutes] = timeString.split(":").map(Number)

  // Convert Vietnam time (UTC+7) to UTC
  let utcHours = hours - 7
  if (utcHours < 0) {
    utcHours += 24
  }

  return `${minutes} ${utcHours} * * *`
}
