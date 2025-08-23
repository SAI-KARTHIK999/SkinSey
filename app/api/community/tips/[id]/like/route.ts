import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const { db } = await connectToDatabase()
    
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid tip ID format" }, { status: 400 })
    }

    // Increment like count for the tip
    const result = await db.collection("tips").updateOne(
      { _id: new ObjectId(id) },
      { $inc: { likes: 1 } }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Tip not found" }, { status: 404 })
    }

    return NextResponse.json({ 
      message: "Tip liked successfully",
      tipId: id 
    })

  } catch (error) {
    console.error("Error liking tip:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
