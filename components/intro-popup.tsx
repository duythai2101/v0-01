"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react"
import { motion } from "framer-motion"

export interface IntroPopupProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const messages = [
  "Hi, Welcome you to Tomorrow! I am Tina. Let's me introduce you something about this product!",
  "Tomorrow helps you store and organize favorite excerpts from books. You can add books, create highlights.",
  "And every morning, you'll receive an email with a random excerpt to inspire your new day! Explore how to use it for yourself.",
]

export function IntroPopup({ open, onOpenChange }: IntroPopupProps) {
  // Character intro states
  const [currentStep, setCurrentStep] = useState(0)
  const [emotion, setEmotion] = useState<"excited" | "thinking" | "surprised">("excited")
  const [isClosing, setIsClosing] = useState(false)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [transitionDirection, setTransitionDirection] = useState<"next" | "back">("next")
  const [displayedMessage, setDisplayedMessage] = useState("")

  // Initialize displayed message
  useEffect(() => {
    setDisplayedMessage(messages[currentStep])
  }, [currentStep])

  // Character images for different emotions
  const characterImages = {
    excited:"https://ghvbvzhojvsfakeuthgs.supabase.co/storage/v1/object/public/avatars/avatars/334c6642-4bfd-4d2e-a50f-c46bd0b68e5f.png",
    thinking: "https://ghvbvzhojvsfakeuthgs.supabase.co/storage/v1/object/public/avatars/avatars/334c6642-4bfd-4d2e-a50f-c46bd0b68e5f.png",
    surprised: "https://ghvbvzhojvsfakeuthgs.supabase.co/storage/v1/object/public/avatars/avatars/334c6642-4bfd-4d2e-a50f-c46bd0b68e5f.png",
  }

  // Animation classes for different emotions
  const getAnimationClass = () => {
    switch (emotion) {
      case "excited":
        return "animate-character-excited"
      case "thinking":
        return "animate-character-thinking"
      case "surprised":
        return "animate-character-surprised"
      default:
        return ""
    }
  }

  // Set emotion based on current step
  useEffect(() => {
    if (currentStep === 0) {
      setEmotion("excited")
    } else if (currentStep === 1) {
      setEmotion("thinking")
    } else {
      setEmotion("surprised")
    }
  }, [currentStep])

  const handleBack = () => {
    if (currentStep > 0 && !isTransitioning) {
      setTransitionDirection("back")
      setIsTransitioning(true)

      setTimeout(() => {
        setCurrentStep(currentStep - 1)
        setTimeout(() => {
          setDisplayedMessage(messages[currentStep - 1])
          setTimeout(() => {
            setIsTransitioning(false)
          }, 50)
        }, 200)
      }, 50)
    }
  }

  const handleNext = () => {
    if (currentStep < messages.length - 1 && !isTransitioning) {
      setTransitionDirection("next")
      setIsTransitioning(true)

      setTimeout(() => {
        setCurrentStep(currentStep + 1)
        setTimeout(() => {
          setDisplayedMessage(messages[currentStep + 1])
          setTimeout(() => {
            setIsTransitioning(false)
          }, 50)
        }, 200)
      }, 50)
    } else if (currentStep === messages.length - 1) {
      // Hoàn thành intro
      handleComplete()
    }
  }

  const handleComplete = () => {
    setIsClosing(true)
    setTimeout(() => {
      onOpenChange(false)
      setIsClosing(false)
      setCurrentStep(0)
    }, 600)
  }

  const handleSkip = () => {
    onOpenChange(false)
  }

  // Get message transition classes
  const getMessageTransitionClasses = () => {
    if (!isTransitioning) return "opacity-100 transform translate-x-0"

    if (transitionDirection === "next") {
      return "animate-message-exit-left"
    } else {
      return "animate-message-exit-right"
    }
  }

  return (
    <>
      <style jsx global>{`
        @keyframes character-excited {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        
        @keyframes character-thinking {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(-2deg); }
          75% { transform: rotate(2deg); }
        }
        
        @keyframes character-surprised {
          0%, 100% { transform: scale(1); }
          10% { transform: scale(1.1); }
          20% { transform: scale(1); }
          30% { transform: scale(1.05); }
          40% { transform: scale(1); }
        }
        
        .animate-character-excited {
          animation: character-excited 2s ease-in-out infinite;
        }
        
        .animate-character-thinking {
          animation: character-thinking 3s ease-in-out infinite;
        }
        
        .animate-character-surprised {
          animation: character-surprised 2s ease-in-out;
          animation-iteration-count: 2;
        }

        @keyframes wiggle {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(-2deg); }
          75% { transform: rotate(2deg); }
        }

        .animate-wiggle {
          animation: wiggle 0.5s ease-in-out infinite;
        }
        
        @keyframes slide-in-left {
          0% { 
            transform: translateX(-100%);
            opacity: 0;
          }
          100% { 
            transform: translateX(0);
            opacity: 1;
          }
        }

        .animate-slide-in-left {
          animation: slide-in-left 0.8s ease-out forwards;
        }

        @keyframes slide-in-right {
          0% { 
            transform: translateX(100%);
            opacity: 0;
          }
          100% { 
            transform: translateX(0);
            opacity: 1;
          }
        }

        .animate-slide-in-right {
          animation: slide-in-right 0.8s ease-out forwards;
        }

        @keyframes fade-in {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }

        .animate-fade-in {
          animation: fade-in 0.5s ease-in-out 0.8s forwards;
        }
        
        @keyframes slide-out-left {
          0% { 
            transform: translateX(0);
            opacity: 1;
          }
          100% { 
            transform: translateX(-100%);
            opacity: 0;
          }
        }

        .animate-slide-out-left {
          animation: slide-out-left 0.6s ease-in forwards;
        }

        @keyframes slide-out-right {
          0% { 
            transform: translateX(0);
            opacity: 1;
          }
          100% { 
            transform: translateX(100%);
            opacity: 0;
          }
        }

        .animate-slide-out-right {
          animation: slide-out-right 0.6s ease-in forwards;
        }
        
        /* Message transition animations */
        @keyframes message-exit-left {
          0% { 
            transform: translateX(0);
            opacity: 1;
          }
          100% { 
            transform: translateX(-30px);
            opacity: 0;
          }
        }
        
        @keyframes message-exit-right {
          0% { 
            transform: translateX(0);
            opacity: 1;
          }
          100% { 
            transform: translateX(30px);
            opacity: 0;
          }
        }
        
        .animate-message-exit-left {
          animation: message-exit-left 0.3s ease-in-out forwards;
        }
        
        .animate-message-exit-right {
          animation: message-exit-right 0.3s ease-in-out forwards;
        }
        
        /* Manga-style speech bubble */
        .manga-bubble {
          position: relative;
          filter: drop-shadow(4px 4px 0px rgba(0, 0, 0, 0.2));
          transform: none;
        }

        .dark .manga-bubble {
          filter: drop-shadow(4px 4px 0px rgba(255, 255, 255, 0.1));
        }

        .manga-bubble-inner {
          position: relative;
          background-color: white;
          border: 2px solid black;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }

        .dark .manga-bubble-inner {
          background-color: #1f2937;
          border-color: #374151;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
        }

        /* Manga-style tail for speech bubble */
        .manga-bubble-tail {
          position: absolute;
          width: 20px;
          height: 20px;
          background-color: white;
          border-left: 2px solid black;
          border-bottom: 2px solid black;
          border-radius: 0 0 0 4px;
          transform: rotate(45deg);
          z-index: -1;
        }

        .dark .manga-bubble-tail {
          background-color: #1f2937;
          border-color: #374151;
        }
        
        /* Manga-style action button */
        .manga-button {
          position: relative;
          background-color: black;
          color: white;
          font-weight: bold;
          border: 0;
          border-radius: 8px;
          transition: all 0.2s;
          overflow: hidden;
        }

        .dark .manga-button {
          background-color: white;
          color: black;
        }

        .manga-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }

        .manga-button:active {
          transform: translateY(0);
          box-shadow: none;
        }
        
        .manga-button::before {
          content: "";
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: linear-gradient(
            to bottom right,
            rgba(255, 255, 255, 0.3),
            rgba(255, 255, 255, 0)
          );
          transform: rotate(45deg);
          pointer-events: none;
        }
      `}</style>

      <Dialog
        open={open}
        onOpenChange={(newOpen) => {
          if (!newOpen) handleComplete()
          else onOpenChange(true)
        }}
      >
        <DialogContent
          className={`max-w-[90vw] md:max-w-[800px] lg:max-w-[900px] p-0 overflow-hidden bg-transparent border-none shadow-none`}
        >
          {/* Character Introduction Phase */}
          <div className="flex flex-col md:flex-row items-center md:items-start gap-4 md:gap-6 relative w-full justify-between">
            {/* Character image */}
            <div
              className={`relative z-10 md:w-2/5 flex justify-center opacity-0 ${isClosing ? "animate-slide-out-left" : "animate-slide-in-left"}`}
            >
              <div
                className={`w-60 h-72 md:w-72 md:h-96 lg:w-80 lg:h-[28rem] flex items-center justify-center overflow-hidden transition-all duration-300 ${getAnimationClass()}`}
              >
                <img
                  src={characterImages[emotion] || "/placeholder.svg"}
                  alt={`Character feeling ${emotion}`}
                  className="w-full h-full object-cover object-center"
                />
              </div>

              {/* Emotion indicators */}
              {emotion === "excited" && (
                <div className="absolute -top-2 -right-2 w-8 h-8 md:w-10 md:h-10 text-yellow-500 animate-pulse">
                  <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                  </svg>
                </div>
              )}

              {emotion === "thinking" && (
                <div className="absolute -top-1 right-4 w-4 h-6 md:w-6 md:h-8 animate-bounce">
                  <div className="w-4 h-4 md:w-6 md:h-6 rounded-full bg-blue-400 dark:bg-blue-500"></div>
                  <div className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-blue-400 dark:bg-blue-500 absolute top-4 md:top-6 left-1"></div>
                </div>
              )}

              {emotion === "surprised" && (
                <>
                  <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-black dark:text-white font-bold text-2xl md:text-4xl animate-bounce">
                    !
                  </div>
                  <div className="absolute -top-4 left-1/4 transform -translate-x-1/2 text-black dark:text-white font-bold text-xl md:text-3xl animate-bounce delay-100">
                    ?
                  </div>
                </>
              )}
            </div>

            {/* Speech bubble */}
            <div
              className={`md:w-3/5 relative opacity-0 ${isClosing ? "animate-slide-out-right" : "animate-slide-in-right"}`}
            >
              <div className="manga-bubble">
                <div className="manga-bubble-tail absolute top-1/3 -left-2.5 md:-left-3"></div>

                <div className="manga-bubble-inner p-5 md:p-6">
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-sm md:text-base uppercase">Tina - Cute Assistant </h3>
                      <div className="text-xs md:text-sm px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-full">
                        {currentStep + 1}/{messages.length}
                      </div>
                    </div>

                    <div className="min-h-[100px] md:min-h-[120px] mb-4 overflow-hidden">
                      <div className={`transition-all duration-300 ${getMessageTransitionClasses()}`}>
                        <p className="text-base md:text-lg leading-relaxed">{displayedMessage}</p>
                      </div>
                    </div>

                    {currentStep >= messages.length - 1 && !isTransitioning && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="flex flex-col space-y-3 pt-4"
                      >
                        <div className="flex justify-end space-x-2">
                          <Button variant="outline" onClick={handleSkip}>
                            Để sau
                          </Button>
                          <Button
                            onClick={handleNext}
                            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                          >
                            Hoàn thành
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        </div>
                      </motion.div>
                    )}

                    {currentStep < messages.length - 1 && (
                      <div className="flex justify-between items-center">
                        <button
                          onClick={handleBack}
                          disabled={currentStep === 0 || isTransitioning}
                          className={`manga-button px-4 py-2 flex items-center ${
                            currentStep === 0 || isTransitioning
                              ? "bg-gray-400 dark:bg-gray-600 cursor-not-allowed opacity-50"
                              : "bg-gray-600 dark:bg-gray-400 hover:bg-gray-700 dark:hover:bg-gray-300"
                          }`}
                        >
                          <ChevronLeft className="mr-2 h-4 w-4" />
                          Go Back
                        </button>

                        <button
                          onClick={handleNext}
                          disabled={isTransitioning}
                          className={`manga-button px-4 py-2 flex items-center ${
                            isTransitioning ? "opacity-50 cursor-not-allowed" : ""
                          }`}
                        >
                          Next
                          <ChevronRight className="ml-2 h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default IntroPopup
