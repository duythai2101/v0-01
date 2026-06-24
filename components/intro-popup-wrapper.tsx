"use client"

import { useIntroPopup } from '@/hooks/use-intro-popup'
import { IntroPopup } from '@/components/intro-popup'
import { useEffect } from 'react'

export function IntroPopupWrapper() {
  const { showIntro, handleIntroComplete, resetIntroState, isInitialCheckComplete } = useIntroPopup()

  // Log để debug
  useEffect(() => {
    console.log('Intro popup state in wrapper:', showIntro)
    console.log('Initial check complete:', isInitialCheckComplete)
  }, [showIntro, isInitialCheckComplete])

  // Reset trạng thái khi component mount (chỉ dùng cho testing)
  useEffect(() => {
    // Bỏ comment dòng dưới để test
    // resetIntroState()
  }, [])

  // Chỉ render IntroPopup sau khi kiểm tra localStorage ban đầu hoàn thành
  if (!isInitialCheckComplete) {
    return null; // Hoặc một loading spinner
  }

  return (
    <IntroPopup 
      open={showIntro} 
      onOpenChange={handleIntroComplete}
    />
  )
}
