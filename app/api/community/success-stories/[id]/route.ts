import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function DELETE(
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
    
    // Validate ObjectId format
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid story ID format" }, { status: 400 })
    }
    
    // Delete success story (only if it belongs to the current user)
    const result = await db.collection("successStories").deleteOne({
      _id: new ObjectId(id),
      ownerEmail: session.user.email
    })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Success story not found or not authorized to delete" }, { status: 404 })
    }

    return NextResponse.json({ 
      message: "Success story deleted successfully",
      storyId: id 
    })

  } catch (error) {
    console.error("Error deleting success story:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
