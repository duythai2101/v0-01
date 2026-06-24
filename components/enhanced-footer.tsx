"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { Facebook, Linkedin, Github } from "lucide-react"

export function EnhancedFooter() {
  const socialLinks = [
    { icon: Facebook, href: "#" },
    { icon: Linkedin, href: "#" },
    { icon: Github, href: "#" },
  ];

  return (
    <footer className="relative z-10 pt-16 pb-8" style={{ borderTopColor: "rgba(234, 224, 207, 0.3)", borderTopWidth: "1px" }}>
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 mb-12">
          {/* Logo and description */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="md:col-span-2"
          >
            <h2 className="text-2xl font-bold mb-4" style={{ color: "#EAE0CF" }}>Tomorrow</h2>
            <p className="mb-6 max-w-md" style={{ color: "rgba(234, 224, 207, 0.85)" }}>
              Tomorrow assists you in finding, organizing, and receiving your carrer.
            </p>
            <div className="flex space-x-4">
              {socialLinks.map((social, index) => (
                <Link
                  key={index}
                  href={social.href}
                  className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                  style={{ backgroundColor: "rgba(234, 224, 207, 0.2)" }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(234, 224, 207, 0.4)"}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "rgba(234, 224, 207, 0.2)"}
                >
                  <social.icon size={16} style={{ color: "#EAE0CF" }} />
                </Link>
              ))}
            </div>
          </motion.div>
        </div> 

        {/* Bottom bar */}
        <div className="pt-8 flex flex-col md:flex-row justify-between items-center" style={{ borderTopColor: "rgba(234, 224, 207, 0.3)", borderTopWidth: "1px" }}>
          <p className="text-sm mb-4 md:mb-0" style={{ color: "rgba(234, 224, 207, 0.7)" }}>
            &copy; {new Date().getFullYear()} Tomorrow. 
          </p>
        </div>
      </div>
    </footer>
  );
}
