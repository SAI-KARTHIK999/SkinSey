import { NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const {
      doctorId,
      doctorName,
      doctorSpecialty,
      date,
      time,
      appointmentType,
      phone,
      notes,
      location,
      coordinates
    } = body

    // Validate required fields
    if (!doctorId || !date || !time || !appointmentType || !phone) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    const { db } = await connectToDatabase()

    // Create appointment document
    const appointment = {
      userId: session.user.email,
      doctorId,
      doctorName,
      doctorSpecialty,
      date: new Date(date),
      time,
      appointmentType,
      phone,
      notes: notes || "",
      location: {
        address: location?.address || "",
        city: location?.city || "",
        state: location?.state || "",
        zipCode: location?.zipCode || "",
        coordinates: coordinates || null
      },
      status: "pending",
      createdAt: new Date(),
      updatedAt: new Date()
    }

    // Insert appointment into database
    const result = await db.collection("appointments").insertOne(appointment)

    return NextResponse.json({
      success: true,
      appointmentId: result.insertedId,
      message: "Appointment booked successfully"
    })

  } catch (error) {
    console.error("Error booking appointment:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { db } = await connectToDatabase()
    
    // Get user's appointments
    const appointments = await db
      .collection("appointments")
      .find({ userId: session.user.email })
      .sort({ date: -1 })
      .toArray()

    return NextResponse.json({ appointments })

  } catch (error) {
    console.error("Error fetching appointments:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}





