import { redirect } from "next/navigation"
import { getServerSession } from "@/lib/server-auth"
import { StarField } from "@/components/star-field"
import { GeometricShapes } from "@/components/geometric-shapes"
import { AnimatedCTAButton } from "@/components/animated-cta-button"
import { TestimonialSection } from "@/components/testimonial-section"
import { EnhancedFooter } from "@/components/enhanced-footer"
import { AnimatedLink } from "@/components/animated-link"

export default async function LandingPage() {
  // Kiểm tra nếu người dùng đã đăng nhập, chuyển hướng đến dashboard
  const session = await getServerSession()
  if (session) {
    redirect("/dashboard")
  }

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Gradient Background */}
      <div 
        className="absolute inset-0 z-0"
        style={{
          background: "linear-gradient(to bottom, #111844 0%, #4B5694 50%, #7288AE 100%)"
        }}
      ></div>

      {/* Stars/Particles */}
      <StarField />

      {/* Geometric Shapes */}
      <GeometricShapes />

      {/* Content */}
      <div className="relative z-20 flex-grow flex flex-col">
        {/* Header */}
        <header className="container mx-auto px-6 py-6">
          <div className="font-bold text-2xl" style={{ color: "#EAE0CF" }}>Tomorrow</div>
        </header>

        {/* Hero Section */}
        <section className="flex-grow flex items-center justify-center px-4 py-20">
          <div className="text-center max-w-3xl mx-auto">
            {/* Decorative Frame */}
            <div className="relative">
              <div className="absolute inset-0 border-2 rounded-lg -m-6" style={{ borderColor: "rgba(234, 224, 207, 0.4)" }}></div>
              <div className="absolute top-0 left-0 w-8 h-1 ml-4" style={{ backgroundColor: "#EAE0CF" }}></div>
              <div className="absolute top-0 left-0 w-1 h-8 ml-4" style={{ backgroundColor: "#EAE0CF" }}></div>
              <div className="absolute top-0 right-0 w-8 h-1 mr-4" style={{ backgroundColor: "#EAE0CF" }}></div>
              <div className="absolute top-0 right-0 w-1 h-8 mr-4" style={{ backgroundColor: "#EAE0CF" }}></div>
              <div className="absolute bottom-0 left-0 w-8 h-1 ml-4" style={{ backgroundColor: "#EAE0CF" }}></div>
              <div className="absolute bottom-0 left-0 w-1 h-8 ml-4" style={{ backgroundColor: "#EAE0CF" }}></div>
              <div className="absolute bottom-0 right-0 w-8 h-1 mr-4" style={{ backgroundColor: "#EAE0CF" }}></div>
              <div className="absolute bottom-0 right-0 w-1 h-8 mr-4" style={{ backgroundColor: "#EAE0CF" }}></div>

              <div className="py-16 px-8">
                <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight drop-shadow-lg" style={{ color: "#EAE0CF" }}>
                  All things are difficult 
                  <br />
                  before they are easy
                </h1>
                <AnimatedLink href="/auth/register">
                  <AnimatedCTAButton>Start Now</AnimatedCTAButton>
                </AnimatedLink>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonial Section */}
        <TestimonialSection />

        {/* Footer */}
        <EnhancedFooter />
      </div>
    </div>
  )
}
