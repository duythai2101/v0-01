"use client"

import { motion } from "framer-motion"
import { Star } from "lucide-react"

interface TestimonialProps {
  name: string
  content: string
  avatarUrl?: string // Optional avatar URL
  role?: string // Optional role
}

const testimonials: TestimonialProps[] = [
  {
    name: "Search jobs from multiple sources",
    content:
      "Aggregate job postings from VietnamWorks, TopCV, Linkedin... in one place.",
  },
  {
    name: "AI fit assessment",
    content:
      "Analyzes your profile and scores how well you fit each specific position.",
  },
  {
    name: "Smart CV builder",
    content:
      "Create a great CV, get checkbox-based improvement suggestions, export a professional PDF, and receive a personalized roadmap to improve your CV for each target job.",
  },
  {
    name: "Application tracking",
    content:
      "Use a Kanban board to track your entire pipeline from Saved → Applied → Interview → Offer.",
  },
  {
    name: "Market research dashboard",
    content:
      "Analyze hiring trends, salary ranges, and in-demand skills by industry.",
  },

]

export function TestimonialSection() {
  return (
    <section className="py-16 relative z-10">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">What we can offer</h2>
          <p className="text-white/80 max-w-2xl mx-auto">
            Discover how to start a carrer
          </p>
        </motion.div>

        <div className={`grid ${testimonials.length === 1 ? 'place-items-center' : 'md:grid-cols-3'} gap-8`}>
          {testimonials.map((testimonial, index) => (
            <TestimonialCard key={index} testimonial={testimonial} delay={index * 0.2} />
          ))}
        </div>
      </div>
    </section>
  )
}

function TestimonialCard({ testimonial, delay }: { testimonial: TestimonialProps; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      viewport={{ once: true }}
      className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 hover:border-white/30 transition-all max-w-lg md:max-w-none" // Added max-w-lg for better single card width
    >
      <div className="flex items-center mb-4">
        <div className="w-12 h-12 rounded-full overflow-hidden mr-4 bg-gradient-to-br from-indigo-500 to-purple-600">
          <img
            src={testimonial.avatarUrl || "/placeholder.svg?height=100&width=100"}
            alt={testimonial.name}
            className="w-full h-full object-cover"
          />
        </div>
        <div>
          <h3 className="font-bold text-white">{testimonial.name}</h3>
          <p className="text-white/70 text-sm">{testimonial.role}</p>
        </div>
      </div>

      <p className="text-white/80 italic">"{testimonial.content}"</p>
    </motion.div>
  )
}
