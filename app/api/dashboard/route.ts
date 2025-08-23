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
    
    // Get user data
    const user = await db.collection("users").findOne(
      { email: session.user.email },
      { projection: { password: 0 } }
    )

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Get user's skin analysis history
    const skinAnalyses = await db.collection("skinAnalyses")
      .find({ userId: user._id })
      .sort({ createdAt: -1 })
      .limit(10)
      .toArray()

    // Get appointments
    const appointments = await db.collection("appointments")
      .find({ userId: session.user.email })
      .sort({ date: 1 })
      .limit(5)
      .toArray()

    // Get reminders
    const reminders = await db.collection("reminders")
      .find({ userId: user._id, completed: false })
      .sort({ dueDate: 1 })
      .toArray()

    // Calculate progress metrics
    const totalAnalyses = skinAnalyses.length
    const averageScore = totalAnalyses > 0 
      ? skinAnalyses.reduce((sum, analysis) => sum + (analysis.score || 0), 0) / totalAnalyses
      : 0

    // Get weekly progress data
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
    
    const weeklyAnalyses = skinAnalyses.filter(
      analysis => new Date(analysis.createdAt) >= oneWeekAgo
    )
    
    const weeklyProgress = weeklyAnalyses.length > 0 
      ? weeklyAnalyses.reduce((sum, analysis) => sum + (analysis.score || 0), 0) / weeklyAnalyses.length
      : 0

    // Get routine completion data
    const routineCompletions = await db.collection("routineCompletions")
      .find({ userId: user._id })
      .sort({ date: -1 })
      .limit(7)
      .toArray()

    const routineCompletionRate = routineCompletions.length > 0
      ? (routineCompletions.filter(r => r.completed).length / routineCompletions.length) * 100
      : 0

    // Prepare dashboard data
    const dashboardData = {
      user: {
        name: user.name || "User",
        email: user.email,
        avatar: user.avatar || "/placeholder-user.jpg"
      },
      metrics: {
        skinHealthScore: Math.round(averageScore),
        weeklyProgress: Math.round(weeklyProgress - averageScore),
        totalAnalyses,
        routineCompletionRate: Math.round(routineCompletionRate),
        upcomingAppointments: appointments.filter(apt => new Date(apt.date) > new Date()).length
      },
      recentActivity: skinAnalyses.slice(0, 5).map(analysis => ({
        id: analysis._id,
        type: "skin_analysis",
        title: "Skin Analysis Completed",
        description: `Score: ${analysis.score}/100`,
        timestamp: analysis.createdAt,
        score: analysis.score,
        condition: analysis.condition || "Normal"
      })),
      appointments: appointments.map(apt => ({
        id: apt._id,
        doctorName: apt.doctorName,
        specialty: apt.specialty,
        date: apt.date,
        time: apt.time,
        status: apt.status
      })),
      reminders: reminders.map(reminder => ({
        id: reminder._id,
        title: reminder.title,
        description: reminder.description,
        dueDate: reminder.dueDate,
        type: reminder.type,
        completed: reminder.completed
      })),
      weeklyProgress: routineCompletions.map(completion => ({
        date: completion.date,
        completed: completion.completed,
        score: completion.score || 0
      }))
    }

    return NextResponse.json(dashboardData)
  } catch (error) {
    console.error("Dashboard API error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

