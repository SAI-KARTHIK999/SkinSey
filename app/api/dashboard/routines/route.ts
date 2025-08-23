import { NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { ObjectId } from "mongodb"

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

    // Get routine completions for the last 7 days
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const routineCompletions = await db.collection("routineCompletions")
      .find({ 
        userId: user._id,
        date: { $gte: sevenDaysAgo }
      })
      .sort({ date: -1 })
      .toArray()

    // Get user's routine template
    const routineTemplate = await db.collection("routineTemplates")
      .findOne({ userId: user._id })

    const routines = {
      completions: routineCompletions,
      template: routineTemplate || {
        morning: [
          { step: "Cleanser", completed: false },
          { step: "Toner", completed: false },
          { step: "Serum", completed: false },
          { step: "Moisturizer", completed: false },
          { step: "Sunscreen", completed: false }
        ],
        evening: [
          { step: "Makeup Remover", completed: false },
          { step: "Cleanser", completed: false },
          { step: "Exfoliant", completed: false },
          { step: "Serum", completed: false },
          { step: "Moisturizer", completed: false }
        ]
      }
    }

    return NextResponse.json(routines)
  } catch (error) {
    console.error("Routines GET API error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { date, morningSteps, eveningSteps, score, completed } = body

    if (!date) {
      return NextResponse.json(
        { error: "Date is required" },
        { status: 400 }
      )
    }

    const routineCompletion = {
      userId: user._id,
      date: new Date(date),
      morningSteps: morningSteps || [],
      eveningSteps: eveningSteps || [],
      score: score || 0,
      completed: typeof completed === 'boolean' ? completed : false,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    // Check if completion already exists for this date
    const existingCompletion = await db.collection("routineCompletions")
      .findOne({
        userId: user._id,
        date: new Date(date)
      })

    let result
    if (existingCompletion) {
      // Update existing completion
      result = await db.collection("routineCompletions").updateOne(
        { _id: existingCompletion._id },
        { $set: routineCompletion }
      )
    } else {
      // Create new completion
      result = await db.collection("routineCompletions").insertOne(routineCompletion)
    }

    return NextResponse.json({
      message: "Routine completion saved successfully",
      completion: { ...routineCompletion, _id: result.insertedId || existingCompletion._id }
    })
  } catch (error) {
    console.error("Routines POST API error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
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

    const body = await request.json()
    const { completionId, morningSteps, eveningSteps, score, completed } = body

    if (!completionId) {
      return NextResponse.json(
        { error: "Completion ID is required" },
        { status: 400 }
      )
    }

    const updateData: any = { updatedAt: new Date() }
    
    if (morningSteps !== undefined) updateData.morningSteps = morningSteps
    if (eveningSteps !== undefined) updateData.eveningSteps = eveningSteps
    if (score !== undefined) updateData.score = score
    if (completed !== undefined) updateData.completed = completed

    const result = await db.collection("routineCompletions").updateOne(
      { _id: new ObjectId(completionId), userId: user._id },
      { $set: updateData }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: "Routine completion not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      message: "Routine completion updated successfully"
    })
  } catch (error) {
    console.error("Routines PUT API error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

