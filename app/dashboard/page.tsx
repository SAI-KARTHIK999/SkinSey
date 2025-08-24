"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Camera,
  MessageCircle,
  Calendar,
  Bell,
  Settings,
  BarChart3,
  TrendingUp,
  Bot,
  Stethoscope,
} from "lucide-react"
import Link from "next/link"
import { ChanseyFAB } from "@/components/chansey-fab"
import { ChanseyMascot } from "@/components/chansey-mascot"
import { useSession } from "next-auth/react"
import LogoutButton from "@/components/auth/logout-button"
import { ProfileDropdown } from "@/components/profile"

import { useOnboarding } from "@/hooks/use-onboarding"

export default function DashboardPage() {
  const { data: session } = useSession()

  const { isChecking } = useOnboarding()

  // Immediately redirect to onboarding if user is authenticated but onboarding check is still pending
  // This prevents the dashboard from showing briefly
  if (session?.user && isChecking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-pink-500 mx-auto mb-4"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-pink-100 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <ChanseyMascot size="sm" />
              <h1 className="text-xl font-bold text-gray-800">Skinsey</h1>
            </Link>

            {/* User Menu */}
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" className="text-gray-600 hover:text-pink-600">
                <Bell className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon" className="text-gray-600 hover:text-pink-600">
                <Settings className="w-5 h-5" />
              </Button>
              

              
              <ProfileDropdown />
              <LogoutButton />
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-800 mb-4">
            Welcome back, {session?.user?.name?.split(" ")[0] || "User"}! 👋
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Your personalized skin health companion is ready to help you on your wellness journey.
          </p>
        </div>

        {/* Main Cards Grid */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Dashboard Card */}
          <Card className="border-pink-100 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-white/90">
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-pink-100 to-rose-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="w-8 h-8 text-pink-600" />
              </div>
              <CardTitle className="text-2xl text-gray-800">Dashboard</CardTitle>
              <CardDescription className="text-gray-600">
                View your complete skin health overview, progress tracking, and detailed analytics
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <div className="mb-4 p-3 bg-pink-50 rounded-lg">
                <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  <span>+12% improvement this week</span>
                </div>
              </div>
              <Button
                className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white rounded-full py-3 font-semibold shadow-lg"
                asChild
              >
                <Link href="/dashboard">View Full Dashboard</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Skin Analyzer Card */}
          <Card className="border-pink-100 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-white/90">
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-pink-100 to-rose-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Camera className="w-8 h-8 text-pink-600" />
              </div>
              <CardTitle className="text-2xl text-gray-800">Skin Analyzer</CardTitle>
              <CardDescription className="text-gray-600">
                AI-powered skin analysis using your photos to identify concerns and get recommendations
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <div className="mb-4 p-3 bg-pink-50 rounded-lg">
                <p className="text-sm text-gray-600">Last analysis: 2 hours ago</p>
                <p className="text-xs text-gray-500">Results: Mild improvement detected</p>
              </div>
              <Button
                className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white rounded-full py-3 font-semibold shadow-lg"
                asChild
              >
                <Link href="/analyze-skin">
                  <Camera className="w-4 h-4 mr-2" />
                  Analyze Skin
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* AI Chatbot Card */}
          <Card className="border-pink-100 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-white/90">
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-pink-100 to-rose-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Bot className="w-8 h-8 text-pink-600" />
              </div>
              <CardTitle className="text-2xl text-gray-800">Chansey AI</CardTitle>
              <CardDescription className="text-gray-600">
                Chat with Chansey AI, your friendly dermatology assistant for personalized skincare advice
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <div className="mb-4 p-3 bg-pink-50 rounded-lg">
                <p className="text-sm text-gray-600">💬 &ldquo;Ask me about skincare routines!&rdquo;</p>
                <p className="text-xs text-gray-500">Available 24/7</p>
              </div>
              <Button
                className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white rounded-full py-3 font-semibold shadow-lg"
                asChild
              >
                <Link href="/dashboard">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Start Chat
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Book Appointment Card */}
          <Card className="border-pink-100 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-white/90">
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-pink-100 to-rose-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Stethoscope className="w-8 h-8 text-pink-600" />
              </div>
              <CardTitle className="text-2xl text-gray-800">Book Appointment</CardTitle>
              <CardDescription className="text-gray-600">
                Schedule consultations with certified dermatologists and skin care specialists
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <div className="mb-4 p-3 bg-pink-50 rounded-lg">
              <p className="text-sm text-gray-600">“Healthy skin is a reflection of overall wellness.”</p>
              <p className="text-xs text-gray-500">— Dermatology Wisdom</p>
              </div>
              <Button
                className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white rounded-full py-3 font-semibold shadow-lg"
                asChild
              >
                <Link href="/book-appointment">
                  <Calendar className="w-4 h-4 mr-2" />
                  Book Appointment
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
        
      </div>
      {/* Floating Chansey AI Button */}
      {/* <ChanseyFAB /> */}
    </div>
  )
}
