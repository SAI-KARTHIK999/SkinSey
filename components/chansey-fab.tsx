"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { MessageCircle } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import Image from "next/image"

export function ChanseyFAB() {
  const [isHovered, setIsHovered] = useState(false)
  const pathname = usePathname()

  // Only show FAB on authenticated pages (after login)
  const authenticatedPages = ["/dashboard", "/full-dashboard", "/analyze-skin", "/book-appointment"]
  const shouldShowFAB = authenticatedPages.some((page) => pathname.startsWith(page))

  // Don't show FAB on chatbot page or unauthenticated pages
  if (pathname === "/chatbot" || !shouldShowFAB) {
    return null
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Tooltip */}
      {isHovered && (
        <div className="absolute bottom-16 right-0 bg-white border border-pink-200 rounded-lg px-3 py-2 shadow-lg whitespace-nowrap">
          <p className="text-sm font-medium text-gray-800">Chat with Chansey AI</p>
          <div className="absolute -bottom-1 right-4 w-2 h-2 bg-white border-r border-b border-pink-200 transform rotate-45"></div>
        </div>
      )}

      {/* FAB Button */}
      <Button
        asChild
        className="w-16 h-16 rounded-full bg-gradient-to-r from-pink-400 to-rose-400 hover:from-pink-500 hover:to-rose-500 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 border-2 border-white"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <Link href="/chatbot">
          <div className="relative w-full h-full flex items-center justify-center">
            <Image src="/chansey-mascot.png" alt="Chansey AI" width={40} height={40} className="w-10 h-10 object-contain" />
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
              <MessageCircle className="w-2 h-2 text-white" />
            </div>
          </div>
        </Link>
      </Button>
    </div>
  )
}
