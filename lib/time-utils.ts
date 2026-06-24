/**
 * Convert time to Vietnam timezone (UTC+7)
 * @returns Current time in Vietnam timezone
 */
export const getCurrentVietnamTime = () => {
  const now = new Date()

  try {
    // Phương pháp 1: Sử dụng Intl API (cách tốt nhất nhưng có thể không được hỗ trợ ở mọi môi trường)
    try {
      const formatter = new Intl.DateTimeFormat("en-US", {
        timeZone: "Asia/Ho_Chi_Minh",
        year: "numeric",
        month: "numeric",
        day: "numeric",
        hour: "numeric",
        minute: "numeric",
        second: "numeric",
        hour12: false,
      })

      const parts = formatter.formatToParts(now)
      const dateObj: Record<string, string> = {}

      parts.forEach((part) => {
        if (part.type !== "literal") {
          dateObj[part.type] = part.value
        }
      })

      // Tạo chuỗi ISO từ các phần
      const year = Number.parseInt(dateObj.year)
      const month = Number.parseInt(dateObj.month) - 1 // Tháng trong JS bắt đầu từ 0
      const day = Number.parseInt(dateObj.day)
      const hour = Number.parseInt(dateObj.hour)
      const minute = Number.parseInt(dateObj.minute)
      const second = Number.parseInt(dateObj.second)

      return new Date(year, month, day, hour, minute, second)
    } catch (intlError) {
      // Nếu Intl API không hoạt động, sử dụng phương pháp 2
      console.warn("Intl API failed for timezone conversion, using manual offset", intlError)
      throw intlError // Chuyển sang phương pháp 2
    }
  } catch (error) {
    // Phương pháp 2: Điều chỉnh thủ công cho UTC+7
    const utcTime = now.getTime()
    const vietnamOffset = 7 * 60 * 60 * 1000 // UTC+7 in milliseconds
    return new Date(utcTime + vietnamOffset)
  }
}

/**
 * Get time in HH:MM format
 * @param date Date object
 * @returns Time string in HH:MM format
 */
export const getTimeString = (date: Date) => {
  // Kiểm tra xem date có phải là Date hợp lệ không
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    console.warn("Invalid date provided to getTimeString, using current time")
    date = new Date() // Sử dụng thời gian hiện tại nếu date không hợp lệ
  }

  const hours = date.getHours().toString().padStart(2, "0")
  const minutes = date.getMinutes().toString().padStart(2, "0")
  return `${hours}:${minutes}`
}

/**
 * Format date for display
 * @param date Date object
 * @returns Formatted date string
 */
export const formatDate = (date: Date) => {
  // Kiểm tra xem date có phải là Date hợp lệ không
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    console.warn("Invalid date provided to formatDate, using current time")
    date = new Date() // Sử dụng thời gian hiện tại nếu date không hợp lệ
  }

  try {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  } catch (error) {
    // Fallback nếu toLocaleDateString không hoạt động
    const day = date.getDate()
    const month = date.getMonth() + 1
    const year = date.getFullYear()
    return `${day}/${month}/${year}`
  }
}

/**
 * Check if the current time matches the target time
 * @param targetTime Time string in HH:MM format
 * @param toleranceMinutes Minutes of tolerance (default: 5)
 * @returns Boolean indicating if times match within tolerance
 */
export const isTimeMatch = (targetTime: string, toleranceMinutes = 5) => {
  // Kiểm tra định dạng của targetTime
  if (!targetTime || !targetTime.match(/^\d{1,2}:\d{2}$/)) {
    console.warn(`Invalid targetTime format: ${targetTime}, expected HH:MM`)
    return false
  }

  try {
    const vietnamTime = getCurrentVietnamTime()
    const currentTimeString = getTimeString(vietnamTime)

    if (currentTimeString === targetTime) return true

    // Add tolerance for serverless execution delays
    const [targetHour, targetMinute] = targetTime.split(":").map(Number)
    const [currentHour, currentMinute] = currentTimeString.split(":").map(Number)

    const targetMinutes = targetHour * 60 + targetMinute
    const currentMinutes = currentHour * 60 + currentMinute
    const diff = Math.abs(targetMinutes - currentMinutes)

    return diff <= toleranceMinutes
  } catch (error) {
    console.error("Error in isTimeMatch:", error)
    return false
  }
}

/**
 * Convert a time string to a cron expression for Vietnam timezone
 * @param timeString Time string in HH:MM format (Vietnam time)
 * @returns Cron expression for UTC time
 */
export const convertVietnamTimeToCron = (timeString: string) => {
  // Kiểm tra định dạng của timeString
  if (!timeString || !timeString.match(/^\d{1,2}:\d{2}$/)) {
    console.warn(`Invalid timeString format: ${timeString}, expected HH:MM`)
    return "0 0 * * *" // Mặc định là 00:00 UTC
  }

  try {
    const [hours, minutes] = timeString.split(":").map(Number)

    // Convert Vietnam time (UTC+7) to UTC
    let utcHours = hours - 7
    if (utcHours < 0) {
      utcHours += 24
    }

    return `${minutes} ${utcHours} * * *`
  } catch (error) {
    console.error("Error in convertVietnamTimeToCron:", error)
    return "0 0 * * *" // Mặc định là 00:00 UTC
  }
}

/**
 * Get the next scheduled run time for a given time
 * @param timeString Time string in HH:MM format
 * @returns Date object representing the next run time
 */
export const getNextRunTime = (timeString: string) => {
  // Kiểm tra định dạng của timeString
  if (!timeString || !timeString.match(/^\d{1,2}:\d{2}$/)) {
    console.warn(`Invalid timeString format: ${timeString}, expected HH:MM`)
    timeString = "06:00" // Mặc định là 6:00 sáng
  }

  try {
    const now = getCurrentVietnamTime()
    const [targetHours, targetMinutes] = timeString.split(":").map(Number)

    const nextRun = new Date(now)
    nextRun.setHours(targetHours, targetMinutes, 0, 0)

    // If the time has already passed today, schedule for tomorrow
    if (nextRun <= now) {
      nextRun.setDate(nextRun.getDate() + 1)
    }

    return nextRun
  } catch (error) {
    console.error("Error in getNextRunTime:", error)
    // Trả về thời gian mặc định (ngày mai 6:00 sáng)
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(6, 0, 0, 0)
    return tomorrow
  }
}
