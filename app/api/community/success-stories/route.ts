import { NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET() {
  try {
    const { db } = await connectToDatabase()
    const stories = await db
      .collection("successStories")
      .find({})
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray()

    return NextResponse.json({ stories })
  } catch (error) {
    console.error("Get success stories error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { title, content } = await request.json()
    if (!content || typeof content !== "string" || content.trim().length === 0) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 })
    }

    const { db } = await connectToDatabase()
    const user = await db.collection("users").findOne({ email: session.user.email })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const doc = {
      userId: user._id,
      userName: user.name || session.user.email,
      ownerEmail: session.user.email,
      title: typeof title === "string" && title.trim().length > 0 ? title.trim() : null,
      content: content.trim(),
      createdAt: new Date(),
    }
    await db.collection("successStories").insertOne(doc)
    return NextResponse.json({ message: "Success story created" }, { status: 201 })
  } catch (error) {
    console.error("Create success story error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}


