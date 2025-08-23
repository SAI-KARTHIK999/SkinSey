"use client"

import { useSession } from "next-auth/react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { User, Mail, Calendar } from "lucide-react"

export default function UserProfile() {
  const { data: session } = useSession()

  if (!session?.user) {
    return null
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <Avatar className="w-20 h-20">
            <AvatarImage src={session.user.image || ""} />
            <AvatarFallback className="text-lg">
              {getInitials(session.user.name || "User")}
            </AvatarFallback>
          </Avatar>
        </div>
        <CardTitle className="text-xl">{session.user.name}</CardTitle>
        <Badge variant="secondary" className="w-fit mx-auto">
          Active User
        </Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-3 text-sm text-gray-600">
          <Mail className="w-4 h-4" />
          <span>{session.user.email}</span>
        </div>
        <div className="flex items-center gap-3 text-sm text-gray-600">
          <User className="w-4 h-4" />
          <span>User ID: {session.user.id}</span>
        </div>
        <div className="flex items-center gap-3 text-sm text-gray-600">
          <Calendar className="w-4 h-4" />
          <span>Member since {new Date().toLocaleDateString()}</span>
        </div>
      </CardContent>
    </Card>
  )
}

