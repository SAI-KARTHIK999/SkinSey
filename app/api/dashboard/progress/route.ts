import { NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { db } = await connectToDatabase()
    
    const user = await db.collection("users").findOne(
      { email: session.user.email }
    )

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Get progress data for the last 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    // Get skin analysis progress
    const skinAnalyses = await db.collection("skinAnalyses")
      .find({ 
        userId: user._id,
        createdAt: { $gte: thirtyDaysAgo }
      })
      .sort({ createdAt: 1 })
      .toArray()

    // Get routine completion progress
    const routineCompletions = await db.collection("routineCompletions")
      .find({ 
        userId: user._id,
        date: { $gte: thirtyDaysAgo }
      })
      .sort({ date: 1 })
      .toArray()

    // Get medication adherence
    const medicationLogs = await db.collection("medicationLogs")
      .find({ 
        userId: user._id,
        date: { $gte: thirtyDaysAgo }
      })
      .sort({ date: 1 })
      .toArray()

    // Calculate daily progress
    const dailyProgress = []
    const today = new Date()
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      
      const dayAnalyses = skinAnalyses.filter(
        analysis => analysis.createdAt.toISOString().split('T')[0] === dateStr
      )
      
      const dayRoutines = routineCompletions.filter(
        routine => routine.date.toISOString().split('T')[0] === dateStr
      )
      
      const dayMedications = medicationLogs.filter(
        med => med.date.toISOString().split('T')[0] === dateStr
      )
      
      dailyProgress.push({
        date: dateStr,
        skinScore: dayAnalyses.length > 0 
          ? dayAnalyses.reduce((sum, a) => sum + (a.score || 0), 0) / dayAnalyses.length
          : null,
        routineCompleted: dayRoutines.some(r => r.completed),
        medicationsTaken: dayMedications.length,
        totalActivities: dayAnalyses.length + dayRoutines.length + dayMedications.length
      })
    }

    // Calculate trends
    const recentScores = dailyProgress
      .filter(day => day.skinScore !== null)
      .slice(-7)
      .map(day => day.skinScore!)
    
    const trend = recentScores.length > 1
      ? recentScores[recentScores.length - 1] - recentScores[0]
      : 0

    // Get top performing days
    const topDays = dailyProgress
      .filter(day => day.totalActivities > 0)
      .sort((a, b) => b.totalActivities - a.totalActivities)
      .slice(0, 5)

    // Get improvement areas
    const improvementAreas = []
    
    if (routineCompletions.filter(r => !r.completed).length > 0) {
      improvementAreas.push("Routine completion")
    }
    
    if (medicationLogs.length < 30) {
      improvementAreas.push("Medication adherence")
    }
    
    if (skinAnalyses.length < 7) {
      improvementAreas.push("Regular skin monitoring")
    }

    const progressData = {
      dailyProgress,
      trends: {
        overallTrend: trend > 0 ? "improving" : trend < 0 ? "declining" : "stable",
        trendValue: Math.abs(trend),
        consistency: dailyProgress.filter(day => day.totalActivities > 0).length / 30
      },
      insights: {
        topPerformingDays: topDays,
        improvementAreas,
        streakDays: calculateStreak(dailyProgress),
        averageDailyScore: dailyProgress
          .filter(day => day.skinScore !== null)
          .reduce((sum, day) => sum + day.skinScore!, 0) / 
          dailyProgress.filter(day => day.skinScore !== null).length || 0
      }
    }

    return NextResponse.json(progressData)
  } catch (error) {
    console.error("Progress API error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

function calculateStreak(dailyProgress: any[]) {
  let currentStreak = 0
  let maxStreak = 0
  let tempStreak = 0
  
  for (const day of dailyProgress) {
    if (day.totalActivities > 0) {
      tempStreak++
      if (day.routineCompleted) {
        currentStreak++
      }
    } else {
      tempStreak = 0
      currentStreak = 0
    }
    
    maxStreak = Math.max(maxStreak, tempStreak)
  }
  
  return {
    current: currentStreak,
    max: maxStreak
  }
}

