"use client"

import { useState, useEffect } from 'react'

const INTRO_POPUP_KEY = 'has_seen_intro'

export function useIntroPopup() {
  const [showIntro, setShowIntro] = useState(false)
  const [isInitialCheckComplete, setIsInitialCheckComplete] = useState(false)

  useEffect(() => {
    // Chạy chỉ một lần ở client side sau khi mount
    try {
      const hasSeenIntro = localStorage.getItem(INTRO_POPUP_KEY)
      console.log('Initial localStorage check - value:', hasSeenIntro) // Debug log

      // Hiển thị intro nếu chưa có giá trị hoặc giá trị không phải 'true'
      if (hasSeenIntro !== 'true') {
        console.log('Initial check: Setting showIntro to true') // Debug log
        setShowIntro(true)
      } else {
        console.log('Initial check: Intro already seen') // Debug log
        setShowIntro(false)
      }
    } catch (error) {
      console.error('Error accessing localStorage on mount:', error)
      // Mặc định hiển thị intro nếu không truy cập được localStorage
      setShowIntro(true)
    } finally {
        setIsInitialCheckComplete(true);
    }
  }, []) // Dependency rỗng để chỉ chạy một lần khi mount

  const handleIntroComplete = () => {
    try {
      console.log('Saving intro completion to localStorage') // Debug log
      localStorage.setItem(INTRO_POPUP_KEY, 'true')
      setShowIntro(false)
    } catch (error) {
      console.error('Error saving to localStorage:', error)
    }
  }

  // Hàm để reset trạng thái (dùng cho testing)
  const resetIntroState = () => {
    try {
      localStorage.removeItem(INTRO_POPUP_KEY)
      console.log('Resetting intro state') // Debug log
      setShowIntro(true)
    } catch (error) {
      console.error('Error resetting localStorage:', error)
    }
  }

  return {
    showIntro,
    setShowIntro,
    handleIntroComplete,
    resetIntroState, // Export thêm hàm reset để test
    isInitialCheckComplete // Export trạng thái kiểm tra ban đầu
  }
}
