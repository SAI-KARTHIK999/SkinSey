import { useState, useRef, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useSession } from "next-auth/react";
import { 
  MapPin, 
  Shield, 
  Activity
} from "lucide-react";

interface ProfileData {
  user: {
    name: string;
    email: string;
    image: string;
    onboardingCompleted: boolean;
    createdAt: string;
    updatedAt: string;
  };
  profile: {
    skinType: string;
    concerns: string[];
    sensitivity: string;
    location: string;
    routine: string[];
  };
  stats: {
    routineProgress: number;
    recentSkinScore: number;
    totalAnalyses: number;
    totalRoutines: number;
  };
  recentAnalyses: Array<{
    id: string;
    score: number;
    condition: string;
    date: string;
  }>;
}

export function ProfileDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const avatarRef = useRef<HTMLDivElement>(null);
  const { data: session, status } = useSession();

  // Get user initials for avatar fallback
  const getUserInitials = () => {
    if (session?.user?.name) {
      return session.user.name
        .split(" ")
        .map(name => name.charAt(0))
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return "U";
  };

  // Fetch profile data when dropdown opens
  const fetchProfileData = async () => {
    // Only fetch if we have a session and aren't already loading
    if (!session?.user?.email || profileData || loading) {
      console.log("Skipping profile fetch:", { 
        hasSession: !!session, 
        hasEmail: !!session?.user?.email, 
        hasProfileData: !!profileData, 
        isLoading: loading 
      });
      return;
    }

    console.log("Fetching profile data for:", session.user.email);
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/user/profile", {
        credentials: "include", // Include cookies for authentication
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      console.log("Profile API response:", response.status, response.statusText);
      
      if (response.ok) {
        const data = await response.json();
        console.log("Profile data received:", data);
        setProfileData(data);
      } else if (response.status === 401) {
        console.log("401 Unauthorized - session may be invalid");
        setError("Please log in to view profile data");
      } else if (response.status === 404) {
        setError("Profile not found");
      } else {
        throw new Error(`Failed to fetch profile: ${response.status}`);
      }
    } catch (error) {
      console.error("Error fetching profile data:", error);
      setError("Failed to load profile data");
    } finally {
      setLoading(false);
    }
  };

  const handleDropdownToggle = () => {
    const newState = !isOpen;
    setIsOpen(newState);
    if (newState && session?.user?.email) {
      fetchProfileData();
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (avatarRef.current && !avatarRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Don't render if session is still loading
  if (status === "loading") {
    return (
      <div className="relative">
        <Avatar className="w-8 h-8">
          <AvatarFallback className="bg-pink-100 text-pink-700">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-pink-600"></div>
          </AvatarFallback>
        </Avatar>
      </div>
    );
  }

  // Don't render if no session
  if (status === "unauthenticated" || !session?.user?.email) {
    return null;
  }

  return (
    <div className="relative">
      {/* Avatar Button */}
      <div ref={avatarRef}>
        <Avatar 
          className="w-8 h-8 cursor-pointer hover:ring-2 hover:ring-pink-200 transition-all"
          onClick={handleDropdownToggle}
        >
          <AvatarImage src={session?.user?.image || "/placeholder-user.jpg?height=32&width=32"} />
          <AvatarFallback className="bg-pink-100 text-pink-700">
            {getUserInitials()}
          </AvatarFallback>
        </Avatar>
      </div>

      {/* Dropdown Popup */}
      {isOpen && (
        <Card className="absolute right-0 mt-2 w-64 z-50 border-pink-100 shadow-lg animate-in fade-in zoom-in-95">
          <CardHeader className="pb-2 border-b border-pink-100">
            <div className="flex items-center gap-2">
              <Avatar className="w-10 h-10">
                <AvatarImage src={session?.user?.image || "/placeholder-user.svg?height=40&width=40"} />
                <AvatarFallback className="bg-pink-100 text-pink-700 text-sm">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <CardTitle className="text-sm font-semibold truncate">
                  {profileData?.user.name || session?.user?.name || "User"}
                </CardTitle>
                <p className="text-xs text-pink-600 truncate">
                  {profileData?.user.email || session?.user?.email || "user@example.com"}
                </p>
                {profileData?.user.onboardingCompleted && (
                  <Badge className="mt-1 bg-green-100 text-green-700 hover:bg-green-100 text-xs px-1.5 py-0.5">
                    Profile Complete
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-3 space-y-3">
            {/* Error State */}
            {error && (
              <div className="text-center py-3">
                <p className="text-xs text-red-600">{error}</p>
                <button 
                  onClick={() => {
                    setError(null);
                    fetchProfileData();
                  }}
                  className="text-xs text-pink-600 hover:text-pink-700 mt-1 underline"
                >
                  Try again
                </button>
              </div>
            )}

            {/* Onboarding Data Section */}
            {profileData && !error && (
              <>
                {/* Skin Profile */}
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                    <Shield className="w-3 h-3 text-pink-600" />
                    Skin Profile
                  </h4>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <p className="text-gray-500 font-medium text-xs">Skin Type</p>
                      <p className="text-pink-700 font-semibold text-xs">
                        {profileData.profile.skinType}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 font-medium text-xs">Sensitivity</p>
                      <p className="text-pink-700 font-semibold text-xs">
                        {profileData.profile.sensitivity}
                      </p>
                    </div>
                  </div>

                  {profileData.profile.concerns.length > 0 && (
                    <div>
                      <p className="text-gray-500 font-medium text-xs mb-1.5">Main Concerns</p>
                      <div className="flex flex-wrap gap-1">
                        {profileData.profile.concerns.slice(0, 2).map((concern, index) => (
                          <span 
                            key={index}
                            className="px-1.5 py-0.5 bg-pink-50 text-pink-700 rounded-full text-xs"
                          >
                            {concern}
                          </span>
                        ))}
                        {profileData.profile.concerns.length > 2 && (
                          <span className="px-1.5 py-0.5 bg-gray-50 text-gray-600 rounded-full text-xs">
                            +{profileData.profile.concerns.length - 2} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {profileData.profile.location && profileData.profile.location !== "Not specified" && (
                    <div className="flex items-center gap-1.5 text-xs">
                      <MapPin className="w-3 h-3 text-gray-500" />
                      <span className="text-gray-600 text-xs">{profileData.profile.location}</span>
                    </div>
                  )}
                </div>

                {/* Stats Section */}
                <div className="space-y-2 pt-2 border-t border-pink-100">
                  <h4 className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                    <Activity className="w-3 h-3 text-pink-600" />
                    Your Progress
                  </h4>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div className="text-center p-1.5 bg-pink-50 rounded-lg">
                      <p className="text-sm font-bold text-pink-700">
                        {profileData.stats.recentSkinScore}
                      </p>
                      <p className="text-xs text-gray-600">Skin Score</p>
                    </div>
                    <div className="text-center p-1.5 bg-pink-50 rounded-lg">
                      <p className="text-sm font-bold text-pink-700">
                        {profileData.stats.totalAnalyses}
                      </p>
                      <p className="text-xs text-gray-600">Analyses</p>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-gray-500">Routine Progress</span>
                      <span className="font-bold text-pink-700">{profileData.stats.routineProgress}%</span>
                    </div>
                    <Progress value={profileData.stats.routineProgress} className="h-1.5 bg-pink-100" />
                  </div>
                </div>
              </>
            )}

            {/* Loading State */}
            {loading && !error && (
              <div className="text-center py-3">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-pink-600 mx-auto"></div>
                <p className="text-xs text-gray-500 mt-1.5">Loading profile...</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}