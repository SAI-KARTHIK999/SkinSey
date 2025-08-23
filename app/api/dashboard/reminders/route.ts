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

    // Get all reminders for the user
    const reminders = await db.collection("reminders")
      .find({ userId: user._id })
      .sort({ dueDate: 1 })
      .toArray()

    return NextResponse.json({ reminders })
  } catch (error) {
    console.error("Reminders GET API error:", error)
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
    const { title, description, dueDate, type, frequency } = body

    if (!title || !dueDate || !type) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    const reminder = {
      userId: user._id,
      title,
      description: description || "",
      dueDate: new Date(dueDate),
      type,
      frequency: frequency || "once",
      completed: false,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const result = await db.collection("reminders").insertOne(reminder)
    
    return NextResponse.json({
      message: "Reminder created successfully",
      reminder: { ...reminder, _id: result.insertedId }
    })
  } catch (error) {
    console.error("Reminders POST API error:", error)
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
    const { reminderId, completed, title, description, dueDate, type } = body

    if (!reminderId) {
      return NextResponse.json(
        { error: "Reminder ID is required" },
        { status: 400 }
      )
    }

    const updateData: any = { updatedAt: new Date() }
    
    if (completed !== undefined) updateData.completed = completed
    if (title) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (dueDate) updateData.dueDate = new Date(dueDate)
    if (type) updateData.type = type

    const result = await db.collection("reminders").updateOne(
      { _id: new ObjectId(reminderId), userId: user._id },
      { $set: updateData }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: "Reminder not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      message: "Reminder updated successfully"
    })
  } catch (error) {
    console.error("Reminders PUT API error:", error)
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
    const reminderId = searchParams.get("id")

    if (!reminderId) {
      return NextResponse.json(
        { error: "Reminder ID is required" },
        { status: 400 }
      )
    }

    const result = await db.collection("reminders").deleteOne({
      _id: new ObjectId(reminderId),
      userId: user._id
    })

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: "Reminder not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      message: "Reminder deleted successfully"
    })
  } catch (error) {
    console.error("Reminders DELETE API error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

