import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function PATCH(
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
      return NextResponse.json({ error: "Invalid appointment ID format" }, { status: 400 })
    }
    
    // Update appointment status to confirmed
    const result = await db.collection("appointments").updateOne(
      { _id: new ObjectId(id), userId: session.user.email },
      { $set: { status: "confirmed", updatedAt: new Date() } }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 })
    }

    if (result.modifiedCount === 0) {
      return NextResponse.json({ error: "Appointment already confirmed or no changes made" }, { status: 400 })
    }

    return NextResponse.json({ 
      message: "Appointment approved successfully",
      appointmentId: id 
    })

  } catch (error) {
    console.error("Error approving appointment:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
