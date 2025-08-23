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

    // Get medication logs for the last 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const medicationLogs = await db.collection("medicationLogs")
      .find({ 
        userId: user._id,
        date: { $gte: thirtyDaysAgo }
      })
      .sort({ date: -1 })
      .toArray()

    // Get user's medication schedule
    const medicationSchedule = await db.collection("medicationSchedules")
      .find({ userId: user._id })
      .toArray()

    const medications = {
      logs: medicationLogs,
      schedule: medicationSchedule || [
        {
          name: "Prescription Cream",
          dosage: "Apply twice daily",
          time: "Morning and Evening",
          frequency: "daily"
        }
      ]
    }

    return NextResponse.json(medications)
  } catch (error) {
    console.error("Medications GET API error:", error)
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
    const { medicationName, dosage, time, notes, date } = body

    if (!medicationName || !dosage || !time) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    const medicationLog = {
      userId: user._id,
      medicationName,
      dosage,
      time,
      notes: notes || "",
      date: new Date(date || Date.now()),
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const result = await db.collection("medicationLogs").insertOne(medicationLog)
    
    return NextResponse.json({
      message: "Medication logged successfully",
      log: { ...medicationLog, _id: result.insertedId }
    })
  } catch (error) {
    console.error("Medications POST API error:", error)
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
    const { logId, medicationName, dosage, time, notes } = body

    if (!logId) {
      return NextResponse.json(
        { error: "Log ID is required" },
        { status: 400 }
      )
    }

    const updateData: any = { updatedAt: new Date() }
    
    if (medicationName) updateData.medicationName = medicationName
    if (dosage) updateData.dosage = dosage
    if (time) updateData.time = time
    if (notes !== undefined) updateData.notes = notes

    const result = await db.collection("medicationLogs").updateOne(
      { _id: new ObjectId(logId), userId: user._id },
      { $set: updateData }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: "Medication log not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      message: "Medication log updated successfully"
    })
  } catch (error) {
    console.error("Medications PUT API error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const logId = searchParams.get("id")

    if (!logId) {
      return NextResponse.json(
        { error: "Log ID is required" },
        { status: 400 }
      )
    }

    const result = await db.collection("medicationLogs").deleteOne({
      _id: new ObjectId(logId),
      userId: user._id
    })

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: "Medication log not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      message: "Medication log deleted successfully"
    })
  } catch (error) {
    console.error("Medications DELETE API error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

