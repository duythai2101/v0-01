"use client"

import { useState, useEffect } from "react"

type CacheData<T> = {
  data: T
  timestamp: number
}

export function useDashboardCache<T>(
  key: string,
  initialValue: T,
  expirationTime: number = 5 * 60 * 1000, // 5 minutes default
) {
  const [value, setValue] = useState<T>(initialValue)
  const [isLoaded, setIsLoaded] = useState(false)

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const item = localStorage.getItem(key)
      if (item) {
        const cachedData: CacheData<T> = JSON.parse(item)
        const now = Date.now()

        // Check if cache is still valid
        if (now - cachedData.timestamp < expirationTime) {
          setValue(cachedData.data)
        } else {
          // Cache expired, remove it
          localStorage.removeItem(key)
        }
      }
      setIsLoaded(true)
    } catch (error) {
      console.error("Error reading from localStorage:", error)
      setIsLoaded(true)
    }
  }, [key, expirationTime])

  // Update localStorage when value changes
  const updateCache = (newValue: T) => {
    try {
      const cacheData: CacheData<T> = {
        data: newValue,
        timestamp: Date.now(),
      }
      localStorage.setItem(key, JSON.stringify(cacheData))
      setValue(newValue)
    } catch (error) {
      console.error("Error writing to localStorage:", error)
    }
  }

  const clearCache = () => {
    try {
      localStorage.removeItem(key)
      setValue(initialValue)
    } catch (error) {
      console.error("Error clearing localStorage:", error)
    }
  }

  return { value, updateCache, clearCache, isLoaded }
}
