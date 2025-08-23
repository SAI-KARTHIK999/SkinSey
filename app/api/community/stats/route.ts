import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"

export async function GET() {
  try {
    const { db } = await connectToDatabase()

    const [activeMembers, tipsShared, successStories] = await Promise.all([
      db.collection("users").countDocuments({}),
      db.collection("tips").countDocuments({}),
      db.collection("successStories").countDocuments({}),
    ])

    return NextResponse.json({
      activeMembers,
      tipsShared,
      successStories,
    })
  } catch (error) {
    console.error("Community stats error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}


