import { NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { skinType, concerns, sensitivity, location, routine } = await request.json()

    if (!skinType) {
      return NextResponse.json(
        { error: "Skin type is required" },
        { status: 400 }
      )
    }

    const { db } = await connectToDatabase()

    // Update user with onboarding data
    const result = await db.collection("users").updateOne(
      { email: session.user.email },
      {
        $set: {
          onboardingCompleted: true,
          profile: {
            skinType,
            concerns,
            sensitivity,
            location,
            routine
          },
          updatedAt: new Date()
        }
      }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { 
        message: "Profile updated successfully",
        onboardingCompleted: true
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Onboarding error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { db } = await connectToDatabase()

    // Get user profile data
    const user = await db.collection("users").findOne(
      { email: session.user.email },
      { projection: { onboardingCompleted: 1, profile: 1 } }
    )

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      onboardingCompleted: user.onboardingCompleted || false,
      profile: user.profile || {}
    })
  } catch (error) {
    console.error("Profile fetch error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

