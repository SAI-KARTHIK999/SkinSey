import React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Shield, Sparkles, Users, Camera, BarChart3, Calendar, MessageCircle,HeartIcon } from "lucide-react"
import Link from "next/link"
import { ChanseyMascot } from "@/components/chansey-mascot"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          {/* Logo and Tagline */}
          <div className="flex flex-col items-center flex-1">
            <div className="flex items-center gap-3 mb-1">
              <ChanseyMascot size="lg" />
              <div className="flex flex-col">
              <h1 className="text-2xl font-bold text-gray-800">Skinsey</h1>
            <p className="text-sm text-gray-600 font-medium">Your gentle skin health companion</p>
            </div>
          </div>
          </div>

          {/* Auth Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="border-pink-200 text-pink-700 hover:bg-pink-50 rounded-full px-6 bg-transparent"
              asChild
            >
              <Link href="/login">Login</Link>
            </Button>
            <Button
              className="bg-gradient-to-r from-pink-400 to-rose-400 hover:from-pink-500 hover:to-rose-500 text-white rounded-full px-6 shadow-lg"
              asChild
            >
              <Link href="/signup">Sign Up</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <Card className="border-pink-100 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-6">
              <div className="flex justify-center mb-4">
                <Badge className="bg-pink-100 text-pink-700 hover:bg-pink-100 px-4 py-1 rounded-full">
                  <Sparkles className="w-4 h-4 mr-1" />
                  AI-Powered Dermatology
                </Badge>
              </div>
              <div className="flex justify-center mb-4">
                <ChanseyMascot size="xl" />
              </div>
              <CardTitle className="text-4xl font-bold text-gray-800 mb-4">Join Skinsey Today</CardTitle>
              <CardDescription className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
                Experience personalized skin care with our advanced AI technology. Meet Chansey AI, your friendly
                dermatology companion who provides expert insights and gentle guidance tailored just for you.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <Button
                size="lg"
                className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white rounded-full px-8 py-3 text-lg font-semibold shadow-lg transform hover:scale-105 transition-all duration-200"
                asChild
              >
                <Link href="/signup">Start Your Skin Journey</Link>
              </Button>

            </CardContent>
          </Card>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">Comprehensive Skin Care Features</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Everything you need to maintain healthy, beautiful skin with the power of AI and expert dermatology guidance
            from Chansey AI.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {/* Skin Dashboard */}
          <Card className="border-pink-100 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-white/90">
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-pink-100 to-rose-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="w-8 h-8 text-pink-600" />
              </div>
              <CardTitle className="text-xl text-gray-800">Skin Dashboard</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-center text-gray-600">
                Track your skin health progress with personalized insights and detailed analytics over time.
              </CardDescription>
            </CardContent>
          </Card>

          {/* Skin Analyzer */}
          <Card className="border-pink-100 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-white/90">
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-pink-100 to-rose-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Camera className="w-8 h-8 text-pink-600" />
              </div>
              <CardTitle className="text-xl text-gray-800">Skin Analyzer</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-center text-gray-600">
                AI-powered skin analysis using your photos to identify concerns and recommend treatments.
              </CardDescription>
            </CardContent>
          </Card>

          {/* Appointment Scheduler */}
          <Card className="border-pink-100 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-white/90">
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-pink-100 to-rose-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-pink-600" />
              </div>
              <CardTitle className="text-xl text-gray-800">Smart Scheduling</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-center text-gray-600">
                Book appointments with dermatologists and set reminders for your skincare routine.
              </CardDescription>
            </CardContent>
          </Card>

          {/* Expert Consultation */}
          <Card className="border-pink-100 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-white/90">
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-pink-100 to-rose-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-8 h-8 text-pink-600" />
              </div>
              <CardTitle className="text-xl text-gray-800">Chansey AI Chat</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-center text-gray-600">
                Chat with Chansey AI for personalized advice and instant answers to your skincare questions.
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </section>

     
      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 border-t border-pink-100">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <ChanseyMascot size="sm" />
            <span className="text-gray-600">© 2024 Skinsey. All rights reserved.</span>
          </div>
          <div className="flex gap-6 text-sm text-gray-500">
            <Link href="#" className="hover:text-pink-600 transition-colors">
              Privacy Policy
            </Link>
            <Link href="#" className="hover:text-pink-600 transition-colors">
              Terms of Service
            </Link>
            <Link href="#" className="hover:text-pink-600 transition-colors">
              Contact
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
