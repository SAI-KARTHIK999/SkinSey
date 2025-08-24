"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Camera, Calendar, TrendingUp, Bell, Settings, LogOut, Sun, Moon, Droplets, 
  Shield, Plus, ChevronRight, ArrowLeft, Clock, Target, Award, AlertTriangle, 
  CheckCircle, Edit, Trash2, Cloud, Thermometer, Wind, Eye, Activity, 
  BarChart3, Users, Lightbulb, Star, Zap, RefreshCw 
} from "lucide-react"
import Link from "next/link"
import { ChanseyFAB } from "@/components/chansey-fab"
import { ChanseyMascot } from "@/components/chansey-mascot"
import { ProfileDropdown } from "@/components/profile"
import { useToast } from "@/hooks/use-toast"
import RoutineTab from "@/components/RoutineTab"
interface DashboardData {
  user: {
    name: string
    email: string
    avatar: string
  }
  metrics: {
    skinHealthScore: number
    weeklyProgress: number
    totalAnalyses: number
    routineCompletionRate: number
    upcomingAppointments: number
  }
  recentActivity: any[]
  appointments: any[]
  reminders: any[]
  weeklyProgress: any[]
  routine : {
    morning: [
      "Cleanse: Gently removes oil",
      "Serum: Niacinamide for acne"
    ],
    evening: [
      "Cleanse: Double cleanse",
      "Moisturize: Oil-free cream"
    ],
    note: "Consistency is key! Follow daily."
  };
}

interface WeatherRecommendations {
  currentWeather: any
  recommendations: {
    immediate: string[]
    daily: string[]
    timeBased: any
    seasonal: string[]
  }
  riskFactors: string[]
  tips: string[]
}

export default function FullDashboardPage() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [weatherData, setWeatherData] = useState<WeatherRecommendations | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")
  const [communityStats, setCommunityStats] = useState<{ activeMembers: number; tipsShared: number; successStories: number } | null>(null)
  const [communityTips, setCommunityTips] = useState<Array<{ _id?: string; id?: string; userId?: string; ownerEmail?: string; userName?: string; content: string; createdAt?: string }>>([])
  const [successStories, setSuccessStories] = useState<Array<{ _id?: string; id?: string; userId?: string; ownerEmail?: string; userName?: string; title?: string; content?: string; createdAt?: string }>>([])
  const [newTip, setNewTip] = useState<string>("")
  const [newStoryTitle, setNewStoryTitle] = useState<string>("")
  const [newStoryContent, setNewStoryContent] = useState<string>("")
  const [isSubmittingStory, setIsSubmittingStory] = useState<boolean>(false)
  const [showAddReminder, setShowAddReminder] = useState(false)
  const [newReminder, setNewReminder] = useState({
    title: "",
    description: "",
    dueDate: "",
    type: "medication",
    frequency: "once"
  })
  const [morningRoutine, setMorningRoutine] = useState<string[]>([]);
  const [eveningRoutine, setEveningRoutine] = useState<string[]>([]);
  const [motivationalNote, setMotivationalNote] = useState<string>("");
  const [reminders, setReminders] = useState<any[]>([])
  // Routine progress for Overview card
  const [overviewMorningCompleted, setOverviewMorningCompleted] = useState(0)
  const [overviewMorningTotal, setOverviewMorningTotal] = useState(0)
  const [overviewEveningCompleted, setOverviewEveningCompleted] = useState(0)
  const [overviewEveningTotal, setOverviewEveningTotal] = useState(0)
  const [timeSlot, setTimeSlot] = useState<string>("")
  const [clock, setClock] = useState<string>("")
  const [refreshingAppointments, setRefreshingAppointments] = useState(false)
  const { toast } = useToast()

  // Live clock + time slot detection
  useEffect(() => {
    const updateClock = () => {
      const now = new Date()
      setClock(now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }))

      const hour = now.getHours()
      if (hour >= 5 && hour < 12) setTimeSlot("morning")
      else if (hour >= 12 && hour < 17) setTimeSlot("afternoon")
      else if (hour >= 17 && hour < 21) setTimeSlot("evening")
      else setTimeSlot("night")
    }

    updateClock()
    const interval = setInterval(updateClock, 1000)
    return () => clearInterval(interval)
  }, [])

  const fetchDashboardData = async (showLoading = false) => {
    if (showLoading) {
      setRefreshingAppointments(true)
    }
    
    try {
      const response = await fetch("/api/dashboard")
      if (response.ok) {
        const data = await response.json()
        setDashboardData(data)
        
        if (showLoading) {
          toast({
            title: "Success",
            description: "Appointments refreshed successfully!",
          })
        }
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
      if (showLoading) {
        toast({
          title: "Error",
          description: "Failed to refresh appointments",
          variant: "destructive"
        })
      }
    } finally {
      setLoading(false)
      if (showLoading) {
        setRefreshingAppointments(false)
      }
    }
  }

  const fetchCommunity = async () => {
    try {
      const [statsRes, tipsRes, storiesRes] = await Promise.all([
        fetch("/api/community/stats"),
        fetch("/api/community/tips"),
        fetch("/api/community/success-stories"),
      ])
      if (statsRes.ok) {
        const s = await statsRes.json()
        setCommunityStats(s)
      }
      if (tipsRes.ok) {
        const t = await tipsRes.json()
        setCommunityTips(t.tips || [])
      }
      if (storiesRes.ok) {
        const ss = await storiesRes.json()
        setSuccessStories(ss.stories || [])
      }
    } catch (e) {
      console.error("Community fetch failed", e)
    }
  }

  const fetchRoutineProgress = async () => {
    try {
      const res = await fetch("/api/dashboard/routines")
      if (!res.ok) return
      const data = await res.json()
      const tpl = data?.template
      const comps = data?.completions || []

      // Totals from template
      const morningTotal = Array.isArray(tpl?.morning) ? tpl.morning.length : 0
      const eveningTotal = Array.isArray(tpl?.evening) ? tpl.evening.length : 0
      setOverviewMorningTotal(morningTotal)
      setOverviewEveningTotal(eveningTotal)

      // Today's completion counts
      const todayKey = new Date().toISOString().split("T")[0]
      const todayComp = comps.find((c: any) => {
        const d = new Date(c.date)
        const key = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().split("T")[0]
        return key === todayKey
      })
      if (todayComp) {
        const mDone = Array.isArray(todayComp.morningSteps) ? todayComp.morningSteps.length : 0
        const eDone = Array.isArray(todayComp.eveningSteps) ? todayComp.eveningSteps.length : 0
        setOverviewMorningCompleted(mDone)
        setOverviewEveningCompleted(eDone)
      } else {
        setOverviewMorningCompleted(0)
        setOverviewEveningCompleted(0)
      }
    } catch {
      // ignore
    }
  }

  const fetchWeatherData = async () => {
    try {
      // Get user location first
      if (!navigator.geolocation) {
        console.error("Geolocation not supported")
        return
      }
  
      navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords
  
        const response = await fetch(
          `/api/dashboard/weather-recommendations?lat=${latitude}&lon=${longitude}`
        )
  
        if (response.ok) {
          const data = await response.json()
          setWeatherData(data)
        } else {
          let errorMessage = "Unknown error"
          try {
            const errorData = await response.json()
            errorMessage = errorData.error || JSON.stringify(errorData)
          } catch {
            errorMessage = await response.text()
          }
          console.error("Weather API failed:", errorMessage)
        }
      })
    } catch (error) {
      console.error("Error fetching weather data:", error)
    }
  }

  const fetchReminders = async () => {
    try {
      const response = await fetch("/api/dashboard/reminders")
      if (response.ok) {
        const data = await response.json()
        setReminders(data.reminders || [])
      }
    } catch (error) {
      console.error("Error fetching reminders:", error)
    }
  }

  const addReminder = async () => {
    try {
      const response = await fetch("/api/dashboard/reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newReminder)
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Reminder added successfully!",
        })
        setShowAddReminder(false)
        setNewReminder({ title: "", description: "", dueDate: "", type: "medication", frequency: "once" })
        fetchReminders()
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add reminder",
        variant: "destructive"
      })
    }
  }

  const toggleReminder = async (reminderId: string, completed: boolean) => {
    try {
      const response = await fetch("/api/dashboard/reminders", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reminderId, completed })
      })

      if (response.ok) {
        fetchReminders()
      }
    } catch (error) {
      console.error("Error updating reminder:", error)
    }
  }

  const deleteReminder = async (reminderId: string) => {
    try {
      const response = await fetch(`/api/dashboard/reminders?id=${reminderId}`, {
        method: "DELETE"
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Reminder deleted successfully!",
        })
        fetchReminders()
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete reminder",
        variant: "destructive"
      })
    }
  }

  useEffect(() => {
    fetchDashboardData()
    fetchWeatherData()
    fetchReminders()
    fetchCommunity()
    fetchRoutineProgress()
  }, [])

  // Refresh data when page becomes visible (e.g., returning from book-appointment)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchDashboardData(false)
      }
    }

    const handleFocus = () => {
      fetchDashboardData(false)
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleFocus)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
    }
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-pink-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  const submitTip = async () => {
    if (!newTip.trim()) {
      toast({ title: "Error", description: "Please enter a tip first", variant: "destructive" })
      return
    }
    try {
      const res = await fetch("/api/community/tips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newTip })
      })
      if (res.ok) {
        setNewTip("")
        toast({ title: "Success", description: "Tip shared!" })
        fetchCommunity()
      } else {
        const err = await res.json().catch(() => ({}))
        toast({ title: "Error", description: err.error || "Failed to share tip", variant: "destructive" })
      }
    } catch {
      toast({ title: "Error", description: "Failed to share tip", variant: "destructive" })
    }
  }

  const submitSuccessStory = async () => {
    if (!newStoryContent.trim()) {
      toast({ title: "Error", description: "Please write your story first", variant: "destructive" })
      return
    }
    try {
      setIsSubmittingStory(true)
      const res = await fetch("/api/community/success-stories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newStoryTitle || undefined, content: newStoryContent })
      })
      if (res.ok) {
        setNewStoryTitle("")
        setNewStoryContent("")
        toast({ title: "Success", description: "Thanks for sharing your story!" })
        fetchCommunity()
      } else {
        const err = await res.json().catch(() => ({}))
        toast({ title: "Error", description: err.error || "Failed to share story", variant: "destructive" })
      }
    } catch {
      toast({ title: "Error", description: "Failed to share story", variant: "destructive" })
    } finally {
      setIsSubmittingStory(false)
    }
  }

  // Appointment Management Functions
  const handleApproveAppointment = async (appointmentId: string) => {
    try {
      const response = await fetch(`/api/appointments/${appointmentId}/approve`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" }
      })
      
      if (response.ok) {
        toast({ title: "Success", description: "Appointment approved successfully!" })
        fetchDashboardData(true) // Refresh appointments
      } else {
        const errorData = await response.json()
        toast({ 
          title: "Error", 
          description: errorData.error || "Failed to approve appointment", 
          variant: "destructive" 
        })
      }
    } catch (error) {
      console.error("Error approving appointment:", error)
      toast({ 
        title: "Error", 
        description: "Failed to approve appointment", 
        variant: "destructive" 
      })
    }
  }

  const handleDeleteAppointment = async (appointmentId: string) => {
    try {
      const response = await fetch(`/api/appointments/${appointmentId}`, {
        method: "DELETE"
      })
      
      if (response.ok) {
        toast({ title: "Success", description: "Appointment deleted successfully!" })
        fetchDashboardData(true) // Refresh appointments
      } else {
        const errorData = await response.json()
        toast({ 
          title: "Error", 
          description: errorData.error || "Failed to delete appointment", 
          variant: "destructive" 
        })
      }
    } catch (error) {
      console.error("Error deleting appointment:", error)
      toast({ 
        title: "Error", 
        description: "Failed to delete appointment", 
        variant: "destructive" 
      })
    }
  }
  

  const handleDeleteTip = async (tipId: string) => {
    try {
      const response = await fetch(`/api/community/tips/${tipId}`, {
        method: "DELETE"
      })
      
      if (response.ok) {
        // Remove from local state
        const updatedTips = communityTips.filter(tip => tip._id !== tipId)
        setCommunityTips(updatedTips)
        toast({ title: "Success", description: "Tip deleted successfully!" })
        fetchCommunity() // Refresh community data
      } else {
        const errorData = await response.json()
        toast({ 
          title: "Error", 
          description: errorData.error || "Failed to delete tip", 
          variant: "destructive" 
        })
      }
    } catch (error) {
      console.error("Error deleting tip:", error)
      toast({ 
        title: "Error", 
        description: "Failed to delete tip", 
        variant: "destructive" 
      })
    }
  }

  const handleDeleteSuccessStory = async (storyId: string) => {
    try {
      const response = await fetch(`/api/community/success-stories/${storyId}`, {
        method: "DELETE"
      })
      
      if (response.ok) {
        // Remove from local state
        const updatedStories = successStories.filter(story => story._id !== storyId)
        setSuccessStories(updatedStories)
        toast({ title: "Success", description: "Success story deleted successfully!" })
        fetchCommunity() // Refresh community data
      } else {
        const errorData = await response.json()
        toast({ 
          title: "Error", 
          description: errorData.error || "Failed to delete success story", 
          variant: "destructive" 
        })
      }
    } catch (error) {
      console.error("Error deleting success story:", error)
      toast({ 
        title: "Error", 
        description: "Failed to delete success story", 
        variant: "destructive" 
      })
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-pink-100 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard"
                className="flex items-center gap-2 text-pink-600 hover:text-pink-700 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                Back
              </Link>
              <div className="flex items-center gap-2">
                <ChanseyMascot size="sm" />
                <h1 className="text-xl font-bold text-gray-800">Skinsey Dashboard</h1>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" className="text-gray-600 hover:text-pink-600">
                <Bell className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon" className="text-gray-600 hover:text-pink-600">
                <Settings className="w-5 h-5" />
              </Button>
              <ProfileDropdown />
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            Good {timeSlot}, {dashboardData?.user.name || "User"}! 👋
          </h2>
          <p className="text-gray-600">Here's your comprehensive skin health overview for today</p>
        </div>

        {/* Main Dashboard Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
  <TabsList className="flex overflow-x-auto no-scrollbar bg-white border border-pink-100">
    <TabsTrigger
      value="overview"
      className="flex-shrink-0 px-4 py-2 text-center data-[state=active]:bg-pink-100 data-[state=active]:text-pink-700"
    >
      Overview
    </TabsTrigger>
    <TabsTrigger
      value="routine"
      className="flex-shrink-0 px-4 py-2 text-center data-[state=active]:bg-pink-100 data-[state=active]:text-pink-700"
    >
      Routine
    </TabsTrigger>
    <TabsTrigger
      value="reminders"
      className="flex-shrink-0 px-4 py-2 text-center data-[state=active]:bg-pink-100 data-[state=active]:text-pink-700"
    >
      Reminders
    </TabsTrigger>
    <TabsTrigger
      value="weather"
      className="flex-shrink-0 px-4 py-2 text-center data-[state=active]:bg-pink-100 data-[state=active]:text-pink-700"
    >
      Weather
    </TabsTrigger>
    <TabsTrigger
      value="community"
      className="flex-shrink-0 px-4 py-2 text-center data-[state=active]:bg-pink-100 data-[state=active]:text-pink-700"
    >
      Community
    </TabsTrigger>
  </TabsList>





          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-6">
                {/* Enhanced Skin Score Card */}
                <Card className="border-pink-100 bg-gradient-to-r from-pink-50 to-rose-50">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-2xl text-gray-800">Skin Health Score</CardTitle>
                        <CardDescription>Based on your recent analysis</CardDescription>
                      </div>
                      <div className="text-right">
                        <div className="text-4xl font-bold text-pink-600">
                          {dashboardData?.metrics.skinHealthScore || 78}
                        </div>
                        <div className="text-sm text-gray-600">out of 100</div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Progress 
                      value={dashboardData?.metrics.skinHealthScore || 78} 
                      className="h-3 mb-4" 
                    />
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <TrendingUp className="w-4 h-4 text-green-500" />
                      <span>
                        {dashboardData?.metrics.weeklyProgress || 12 > 0 ? "+" : ""}
                        {dashboardData?.metrics.weeklyProgress || 12}% improvement this week
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card className="border-pink-100">
                  <CardHeader>
                    <CardTitle className="text-xl text-gray-800">Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-4">
                      <Button
                        className="h-20 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white rounded-xl flex flex-col gap-2"
                        asChild
                      >
                        <Link href="/analyze-skin">
                          <Camera className="w-6 h-6" />
                          <span>Analyze Skin</span>
                        </Link>
                      </Button>
                      <Button
                        variant="outline"
                        className="h-20 border-pink-200 hover:bg-pink-50 rounded-xl flex flex-col gap-2 bg-transparent"
                        asChild
                      >
                        <Link href="/book-appointment">
                          <Calendar className="w-6 h-6 text-pink-600" />
                          <span>Book Appointment</span>
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Activity */}
                <Card className="border-pink-100">
                  <CardHeader>
                    <CardTitle className="text-xl text-gray-800">Recent Activity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {(dashboardData?.recentActivity || []).map((activity, index) => (
                        <div key={index} className="flex items-center gap-4 p-3 bg-pink-50 rounded-lg">
                          <div className="w-10 h-10 bg-pink-200 rounded-full flex items-center justify-center">
                            <Camera className="w-5 h-5 text-pink-600" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-gray-800">{activity.title}</p>
                            <p className="text-sm text-gray-600">{activity.description}</p>
                          </div>
                          <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                            {activity.score}/100
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Today's Routine */}
                <Card className="border-pink-100">
                  <CardHeader>
                    <CardTitle className="text-lg text-gray-800">Today's Routine</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                        <Sun className="w-4 h-4 text-yellow-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-800">Morning Routine</p>
                        <p className="text-sm text-gray-600">
                          {overviewMorningCompleted}/{overviewMorningTotal} completed
                        </p>
                      </div>
                      <Progress value={overviewMorningTotal ? (overviewMorningCompleted / overviewMorningTotal) * 100 : 0} className="w-16 h-2" />
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                        <Moon className="w-4 h-4 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-800">Evening Routine</p>
                        <p className="text-sm text-gray-600">{overviewEveningCompleted}/{overviewEveningTotal} completed</p>
                      </div>
                      <Progress value={overviewEveningTotal ? (overviewEveningCompleted / overviewEveningTotal) * 100 : 0} className="w-16 h-2" />
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full mt-3 border-pink-200 text-pink-600 hover:bg-pink-50 bg-transparent"
                    >
                      View Routine Details
                    </Button>
                  </CardContent>
                </Card>

                {/* Upcoming Appointments */}
                <Card className="border-pink-100">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg text-gray-800">Appointments</CardTitle>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => fetchDashboardData(true)}
                          disabled={refreshingAppointments}
                          className="text-pink-600 hover:text-pink-700"
                        >
                          <RefreshCw className={`w-4 h-4 ${refreshingAppointments ? 'animate-spin' : ''}`} />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-pink-600 hover:text-pink-700"
                          asChild
                        >
                          <Link href="/book-appointment">
                            <Plus className="w-4 h-4" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {dashboardData?.appointments && dashboardData.appointments.length > 0 ? (
                        <>
                          {dashboardData.appointments.slice(0, 2).map((apt, index) => (
                            <div key={index} className="p-3 bg-pink-50 rounded-lg border border-pink-100">
                              <div className="flex items-center justify-between mb-2">
                                <p className="font-medium text-gray-800">{apt.doctorName}</p>
                                <Badge 
                                  variant={apt.status === 'confirmed' ? 'default' : 'secondary'}
                                  className={apt.status === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}
                                >
                                  {apt.status === 'confirmed' ? 'Confirmed' : apt.status}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-600 mb-1">{apt.specialty}</p>
                              <div className="flex items-center justify-between mb-2">
                                <p className="text-sm text-gray-500">{apt.time}</p>
                                <Badge className="bg-pink-100 text-pink-700 hover:bg-pink-100">
                                  {new Date(apt.date).toLocaleDateString()}
                                </Badge>
                              </div>
                              {/* Appointment Actions */}
                              <div className="flex items-center gap-2 pt-2 border-t border-pink-100">
                                {apt.status !== 'confirmed' && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleApproveAppointment(apt._id || apt.id)}
                                    className="text-xs border-green-200 text-green-700 hover:bg-green-50"
                                  >
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    Approve
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDeleteAppointment(apt._id || apt.id)}
                                  className="text-xs border-red-200 text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="w-3 h-3 mr-1" />
                                  Delete
                                </Button>
                              </div>
                            </div>
                          ))}
                          
                          {dashboardData.appointments.length > 2 && (
                            <p className="text-xs text-gray-500 text-center">
                              +{dashboardData.appointments.length - 2} more appointments
                            </p>
                          )}
                        </>
                      ) : (
                        <div className="text-center py-6">
                          <Calendar className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-500 mb-3">No appointments scheduled</p>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-pink-200 text-pink-600 hover:bg-pink-50"
                            asChild
                          >
                            <Link href="/book-appointment">
                              Book Your First Appointment
                            </Link>
                          </Button>
                        </div>
                      )}

                      <Button
                        variant="outline"
                        className="w-full border-pink-200 text-pink-600 hover:bg-pink-50 bg-transparent"
                        asChild
                      >
                        <Link href="/book-appointment">
                          {dashboardData?.appointments && dashboardData.appointments.length > 0 
                            ? 'View All Appointments' 
                            : 'Book Appointment'
                          }
                          <ChevronRight className="w-4 h-4 ml-2" />
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Health Tips */}
                <Card className="border-pink-100">
                  <CardHeader>
                    <CardTitle className="text-lg text-gray-800">Today's Tip</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="p-4 bg-gradient-to-r from-pink-50 to-rose-50 rounded-lg">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-pink-200 rounded-full flex items-center justify-center flex-shrink-0">
                          <Shield className="w-4 h-4 text-pink-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-800 mb-1">UV Protection</p>
                          <p className="text-sm text-gray-600">
                            Apply sunscreen 30 minutes before going outside, even on cloudy days. 
                            Reapply every 2 hours for optimal protection.
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Routine Tab */}
          <TabsContent value="routine" className="space-y-6">
            <RoutineTab
              onProgressChangeAction={({ morningCompleted, morningTotal, eveningCompleted, eveningTotal }) => {
                setOverviewMorningCompleted(morningCompleted)
                setOverviewMorningTotal(morningTotal)
                setOverviewEveningCompleted(eveningCompleted)
                setOverviewEveningTotal(eveningTotal)
              }}
            />
          </TabsContent>

          {/* Reminders Tab */}
          <TabsContent value="reminders" className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold text-gray-800">Reminders & Tasks</h3>
              <Dialog open={showAddReminder} onOpenChange={setShowAddReminder}>
                <DialogTrigger asChild>
                  <Button className="bg-pink-600 hover:bg-pink-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Reminder
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Reminder</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="title">Title</Label>
                      <Input
                        id="title"
                        value={newReminder.title}
                        onChange={(e) => setNewReminder({ ...newReminder, title: e.target.value })}
                        placeholder="e.g., Take medication"
                      />
                    </div>
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={newReminder.description}
                        onChange={(e) => setNewReminder({ ...newReminder, description: e.target.value })}
                        placeholder="Optional description"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="dueDate">Due Date</Label>
                        <Input
                          id="dueDate"
                          type="datetime-local"
                          value={newReminder.dueDate}
                          onChange={(e) => setNewReminder({ ...newReminder, dueDate: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="type">Type</Label>
                        <Select
                          value={newReminder.type}
                          onValueChange={(value) => setNewReminder({ ...newReminder, type: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="medication">Medication</SelectItem>
                            <SelectItem value="routine">Routine</SelectItem>
                            <SelectItem value="appointment">Appointment</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setShowAddReminder(false)}>
                        Cancel
                      </Button>
                      <Button onClick={addReminder}>Add Reminder</Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid gap-4">
              {reminders.map((reminder) => (
                <Card key={reminder._id} className="border-pink-100">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center">
                          <Clock className="w-5 h-5 text-pink-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">{reminder.title}</p>
                          <p className="text-sm text-gray-600">{reminder.description}</p>
                          <p className="text-xs text-gray-500">
                            Due: {new Date(reminder.dueDate).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleReminder(reminder._id, !reminder.completed)}
                          className={reminder.completed ? "text-green-600" : "text-gray-600"}
                        >
                          {reminder.completed ? <CheckCircle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteReminder(reminder._id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {reminders.length === 0 && (
                <Card className="border-pink-100">
                  <CardContent className="p-8 text-center">
                    <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No reminders yet</p>
                    <p className="text-sm text-gray-500">Add your first reminder to stay on track</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="weather" className="space-y-6">
            {weatherData && (
              <div className="grid lg:grid-cols-2 gap-6">
                {/* Current Weather */}
                <Card className="border-pink-100">
                  <CardHeader>
                    <CardTitle className="text-xl text-gray-800">Current Weather</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <Cloud className="w-6 h-6 text-blue-600" />
                        <span className="text-lg font-medium">
                          {weatherData.currentWeather?.condition || "N/A"}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center gap-2">
                          <Thermometer className="w-5 h-5 text-red-600" />
                          <span>
                            {weatherData.currentWeather?.temperature !== undefined
                              ? `${Math.round(weatherData.currentWeather.temperature)}°C`
                              : "N/A"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Droplets className="w-5 h-5 text-blue-600" />
                          <span>{weatherData.currentWeather?.humidity ?? "N/A"}%</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Eye className="w-5 h-5 text-yellow-600" />
                          <span>UV {weatherData.currentWeather?.uvIndex ?? "N/A"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Wind className="w-5 h-5 text-gray-600" />
                          <span>{weatherData.currentWeather?.windSpeed ?? "N/A"} km/h</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Skincare Recommendations */}
                <Card className="border-green-100">
                  <CardHeader>
                    <CardTitle className="text-xl text-gray-800">Skincare Recommendations</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <h3 className="font-medium text-gray-700">Immediate</h3>
                      <ul className="list-disc ml-5 text-sm">
                        {weatherData.recommendations?.immediate?.length ? (
                          weatherData.recommendations.immediate.map((r: string, i: number) => (
                            <li key={i}>{r}</li>
                          ))
                        ) : (
                          <li>No immediate recommendations</li>
                        )}
                      </ul>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-700">Daily</h3>
                      <ul className="list-disc ml-5 text-sm">
                        {weatherData.recommendations?.daily?.length ? (
                          weatherData.recommendations.daily.map((r: string, i: number) => (
                            <li key={i}>{r}</li>
                          ))
                        ) : (
                          <li>No daily recommendations</li>
                        )}
                      </ul>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-700">Risk Factors</h3>
                      <ul className="list-disc ml-5 text-sm text-red-600">
                        {weatherData.riskFactors?.length ? (
                          weatherData.riskFactors.map((r: string, i: number) => (
                            <li key={i}>{r}</li>
                          ))
                        ) : (
                          <li>No risk factors detected</li>
                        )}
                      </ul>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-700">Tips</h3>
                      <ul className="list-disc ml-5 text-sm">
                        {weatherData.tips?.length ? (
                          weatherData.tips.map((r: string, i: number) => (
                            <li key={i}>{r}</li>
                          ))
                        ) : (
                          <li>No tips available</li>
                        )}
                      </ul>
                    </div>
                  </CardContent>
                </Card>

                {/* Time-Based Routine */}
                <Card className="border-yellow-100 lg:col-span-2">
                  {/* <CardHeader>
                    <CardTitle className="text-xl text-gray-800 flex items-center gap-2">
                      <Clock className="w-5 h-5 text-gray-600" />
                      Time-Based Routine ({clock})
                    </CardTitle>
                  </CardHeader> */}
                  <Card className="border-yellow-100 lg:col-span-2">
  <CardHeader>
    <CardTitle className="text-xl text-gray-800 flex items-center gap-2">
      <Clock className="w-5 h-5 text-gray-600" />
      Time-Based Routine ({clock})
      <Badge variant="outline" className="ml-auto capitalize">
        {timeSlot}
      </Badge>
    </CardTitle>
  </CardHeader>
  <CardContent>
    {weatherData?.recommendations?.timeBased?.[timeSlot]?.length ? (
      <div className="space-y-3">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center mt-1 flex-shrink-0">
            {timeSlot === "morning" && <Sun className="w-4 h-4 text-yellow-600" />}
            {timeSlot === "afternoon" && <Activity className="w-4 h-4 text-orange-600" />}
            {timeSlot === "evening" && <Moon className="w-4 h-4 text-purple-600" />}
            {timeSlot === "night" && <Zap className="w-4 h-4 text-blue-600" />}
          </div>
          <ul className="space-y-2">
            {weatherData.recommendations.timeBased[timeSlot].map(
              (s: string, i: number) => (
                <li key={i} className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>{s}</span>
                </li>
              )
            )}
          </ul>
        </div>
        <div className="mt-4 pt-4 border-t border-yellow-100">
          <p className="text-sm text-gray-600">
            <span className="font-medium">Weather Note:</span> These recommendations 
            are adjusted for {weatherData?.currentWeather?.condition.toLowerCase()} 
            conditions (UV {weatherData?.currentWeather?.uvIndex}, 
            {weatherData?.currentWeather?.temperature}°C)
          </p>
        </div>
      </div>
    ) : (
      <div className="text-center py-8">
        <Clock className="w-10 h-10 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-600">No routine available for this time</p>
        <p className="text-sm text-gray-500 mt-1">
          Check back later or customize your routine in settings
        </p>
      </div>
    )}
  </CardContent>
</Card>
                </Card>

                {/* Seasonal Tips */}
                <Card className="border-purple-100 lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="text-xl text-gray-800">Seasonal Tips</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="list-disc ml-5 text-sm">
                      {weatherData.recommendations?.seasonal?.length ? (
                        weatherData.recommendations.seasonal.map((s: string, i: number) => (
                          <li key={i}>{s}</li>
                        ))
                      ) : (
                        <li>No seasonal tips available</li>
                      )}
                    </ul>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>



          {/* Community Tab */}
          <TabsContent value="community" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Community Tips (with submission) */}
              <Card className="border-pink-100">
                <CardHeader>
                  <CardTitle className="text-xl text-gray-800">Community Tips</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Share a skincare tip with the community"
                        value={newTip}
                        onChange={(e) => setNewTip(e.target.value)}
                      />
                      <Button onClick={submitTip}>Share</Button>
                    </div>
                    {communityTips.length === 0 && (
                      <p className="text-sm text-gray-500">No tips yet. Be the first to share!</p>
                    )}
                    <div className="space-y-3">
                      {communityTips.map((tip, idx) => (
                        <div key={idx} className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
                          <div className="flex items-start gap-3">
                            <Avatar className="w-8 h-8">
                              <AvatarImage src="/placeholder-user.jpg" />
                              <AvatarFallback>{(tip.userName || 'U').slice(0,2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <p className="font-medium text-gray-800">{tip.userName || 'Anonymous'}</p>
                              <p className="text-sm text-gray-600 mb-2">{tip.content}</p>
                              <div className="flex items-center justify-between">
                                <div className="text-xs text-gray-500">
                                  {tip.createdAt ? new Date(tip.createdAt).toLocaleString() : null}
                                </div>
                                {/* Community Tip Actions */}
                                <div className="flex items-center gap-2">
                                  {(tip.ownerEmail && tip.ownerEmail === dashboardData?.user?.email) && (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => handleDeleteTip(tip._id || tip.id)}
                                      className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                                    >
                                      <Trash2 className="w-3 h-3 mr-1" />
                                      Delete
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Community Stats (from DB) */}
              <Card className="border-pink-100">
                <CardHeader>
                  <CardTitle className="text-xl text-gray-800">Community Stats</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-pink-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Users className="w-5 h-5 text-pink-600" />
                        <span className="font-medium">Active Members</span>
                      </div>
                      <span className="text-lg font-bold text-pink-600">{communityStats?.activeMembers ?? '—'}</span>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Lightbulb className="w-5 h-5 text-green-600" />
                        <span className="font-medium">Tips Shared</span>
                      </div>
                      <span className="text-lg font-bold text-green-600">{communityStats?.tipsShared ?? '—'}</span>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Activity className="w-5 h-5 text-blue-600" />
                        <span className="font-medium">Success Stories</span>
                      </div>
                      <span className="text-lg font-bold text-blue-600">{communityStats?.successStories ?? '—'}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Success Stories (visible to all users, users can submit) */}
            <Card className="border-blue-100">
              <CardHeader>
                <CardTitle className="text-xl text-gray-800">Success Stories</CardTitle>
                <CardDescription>Real results shared by the community</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4 flex gap-2">
                  <Input
                    placeholder="Give your story a short title (optional)"
                    value={(undefined as unknown as string) /* placeholder keep type inference */}
                    onChange={() => {}}
                    className="hidden"
                  />
                  {/* Simple two-field form */}
                  <div className="flex-1">
                    <Input
                      placeholder="Share your success story"
                      value={(undefined as unknown as string)}
                      onChange={() => {}}
                      className="hidden"
                    />
                  </div>
                </div>
                {/* Actual visible form */}
                <div className="mb-4 grid gap-2 md:grid-cols-[1fr_auto]">
                  <Input
                    placeholder="Story title (optional)"
                    value={newStoryTitle}
                    onChange={(e) => setNewStoryTitle(e.target.value)}
                  />
                  <div className="md:col-span-2 flex gap-2">
                    <Input
                      placeholder="Write your success story"
                      value={newStoryContent}
                      onChange={(e) => setNewStoryContent(e.target.value)}
                      className="flex-1"
                    />
                    <Button disabled={isSubmittingStory} onClick={submitSuccessStory}>
                      {isSubmittingStory ? 'Sharing...' : 'Share'}
                    </Button>
                  </div>
                </div>
                {successStories.length === 0 && (
                  <p className="text-sm text-gray-500">No success stories yet. Check back soon!</p>
                )}
                <div className="space-y-4">
                  {successStories.map((story, idx) => (
                    <div key={idx} className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg">
                      <div className="flex items-start gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src="/placeholder-user.jpg" />
                          <AvatarFallback>{(story.userName || 'U').slice(0,2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-medium text-gray-800">{story.title || 'Success Story'}</p>
                          <p className="text-sm text-gray-600 mb-2">{story.content}</p>
                          <div className="flex items-center justify-between">
                            <div className="text-xs text-gray-500">
                              {story.userName || 'Anonymous'}{story.createdAt ? ` • ${new Date(story.createdAt).toLocaleString()}` : ''}
                            </div>
                            {/* Success Story Actions */}
                            {(story.ownerEmail && story.ownerEmail === dashboardData?.user?.email) && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteSuccessStory(story._id || story.id)}
                                className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="w-3 h-3 mr-1" />
                                Delete
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Floating Chansey AI Button */}
      {/* <ChanseyFAB /> */}
    </div>
  )
}
