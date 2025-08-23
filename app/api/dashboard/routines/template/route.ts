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

    const routineTemplate = await db.collection("routineTemplates").findOne({ userId: user._id })

    return NextResponse.json({
      template: routineTemplate || null
    })
  } catch (error) {
    console.error("Routine template GET API error:", error)
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
    const { morning, evening, note } = body || {}

    if (!Array.isArray(morning) || !Array.isArray(evening)) {
      return NextResponse.json({ error: "Invalid template payload" }, { status: 400 })
    }

    const now = new Date()
    const templateDoc = {
      userId: user._id,
      morning,
      evening,
      note: note || "",
      updatedAt: now,
      createdAt: now
    }

    const existing = await db.collection("routineTemplates").findOne({ userId: user._id })
    if (existing) {
      await db.collection("routineTemplates").updateOne(
        { _id: existing._id },
        { $set: { morning, evening, note: note || "", updatedAt: now } }
      )
    } else {
      await db.collection("routineTemplates").insertOne(templateDoc)
    }

    return NextResponse.json({ message: "Routine template saved" })
  } catch (error) {
    console.error("Routine template PUT API error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}


