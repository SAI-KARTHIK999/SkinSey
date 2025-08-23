"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Navigation, Loader2, CheckCircle, AlertCircle, Info, Search } from "lucide-react"
import { toast } from "sonner"
import { 
  getFullLocation, 
  LocationData, 
  LocationCoordinates, 
  LocationAddress 
} from "@/lib/geolocation"

interface LocationInputProps {
  onLocationChange: (location: {
    address: string
    city: string
    state: string
    zipCode: string
    coordinates: LocationCoordinates | null
  }) => void
  onFindDoctors?: (coordinates: LocationCoordinates) => void
  initialLocation?: {
    address: string
    city: string
    state: string
    zipCode: string
  }
}

export function LocationInput({ onLocationChange, onFindDoctors, initialLocation }: LocationInputProps) {
  const [isClient, setIsClient] = useState(false)
  const [locationData, setLocationData] = useState<LocationData>({
    coordinates: null,
    address: null
  })
  const [isGettingLocation, setIsGettingLocation] = useState(false)
  const [isGeocoding, setIsGeocoding] = useState(false)
  const [manualInput, setManualInput] = useState({
    address: initialLocation?.address || "",
    city: initialLocation?.city || "",
    state: initialLocation?.state || "",
    zipCode: initialLocation?.zipCode || ""
  })
  const [locationStatus, setLocationStatus] = useState<"idle" | "success" | "error">("idle")

  // Ensure we're on the client side
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Forward geocoding function to get coordinates from address
  const forwardGeocode = async (address: string, city: string, state: string, zipCode: string): Promise<LocationCoordinates | null> => {
    try {
      const query = `${address}, ${city}, ${state} ${zipCode}`.trim()
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`
      )
      
      if (!response.ok) {
        throw new Error("Failed to geocode address")
      }

      const data = await response.json()
      
      if (data && data.length > 0) {
        return {
          latitude: parseFloat(data[0].lat),
          longitude: parseFloat(data[0].lon)
        }
      }
      
      return null
    } catch (error) {
      console.error("Error in forward geocoding:", error)
      return null
    }
  }

  // Memoize the location change callback to prevent unnecessary re-renders
  const handleLocationChange = useCallback(() => {
    // Check if we have either coordinates or manual input
    const hasCoordinates = locationData.coordinates !== null
    const hasManualInput = Object.values(manualInput).some(val => val.trim() !== "")
    
    if (hasCoordinates || hasManualInput) {
      onLocationChange({
        address: locationData.address?.address || manualInput.address,
        city: locationData.address?.city || manualInput.city,
        state: locationData.address?.state || manualInput.state,
        zipCode: locationData.address?.zipCode || manualInput.zipCode,
        coordinates: locationData.coordinates
      })
    }
  }, [locationData, manualInput, onLocationChange])

  useEffect(() => {
    // Update parent component when location changes
    handleLocationChange()
  }, [handleLocationChange])

  const handleGetLiveLocation = async () => {
    setIsGettingLocation(true)
    setLocationStatus("idle")
    
    try {
      const location = await getFullLocation()
      setLocationData(location)
      
      if (location.coordinates && location.address) {
        setManualInput({
          address: location.address.address,
          city: location.address.city,
          state: location.address.state,
          zipCode: location.address.zipCode
        })
        setLocationStatus("success")
        toast.success("Location detected successfully!")
      } else {
        setLocationStatus("error")
        toast.error("Could not detect location. Please enter manually.")
      }
    } catch (error) {
      console.error("Error getting location:", error)
      setLocationStatus("error")
      toast.error("Failed to get location. Please enter manually.")
    } finally {
      setIsGettingLocation(false)
    }
  }

  const handleManualInputChange = (field: keyof typeof manualInput, value: string) => {
    setManualInput(prev => ({ ...prev, [field]: value }))
  }

  const handleGeocodeManualAddress = async () => {
    if (!manualInput.address || !manualInput.city || !manualInput.state) {
      toast.error("Please fill in at least Street Address, City, and State")
      return
    }

    setIsGeocoding(true)
    setLocationStatus("idle")

    try {
      const coordinates = await forwardGeocode(
        manualInput.address,
        manualInput.city,
        manualInput.state,
        manualInput.zipCode
      )

      if (coordinates) {
        setLocationData(prev => ({
          ...prev,
          coordinates
        }))
        setLocationStatus("success")
        toast.success("Address geocoded successfully!")
      } else {
        setLocationStatus("error")
        toast.error("Could not geocode address. You can still proceed with manual input.")
      }
    } catch (error) {
      console.error("Error geocoding address:", error)
      setLocationStatus("error")
      toast.error("Failed to geocode address. You can still proceed with manual input.")
    } finally {
      setIsGeocoding(false)
    }
  }

  const getStatusIcon = () => {
    switch (locationStatus) {
      case "success":
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case "error":
        return <AlertCircle className="w-4 h-4 text-red-600" />
      default:
        return null
    }
  }

  const getStatusText = () => {
    switch (locationStatus) {
      case "success":
        return "Location detected"
      case "error":
        return "Location detection failed"
      default:
        return ""
    }
  }

  const hasValidManualInput = manualInput.address && manualInput.city && manualInput.state

  return (
    <Card className="border-pink-100 bg-gradient-to-r from-pink-50/50 to-rose-50/50 shadow-lg hover:shadow-xl transition-all duration-300">
      <CardHeader>
        <CardTitle className="text-xl text-gray-800 flex items-center gap-2">
          <MapPin className="w-6 h-6 text-pink-600" />
          Your Location
        </CardTitle>
        <p className="text-gray-600 text-sm">
          Please provide your location to help us schedule your appointment at the nearest clinic.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Live Location Button */}
        {isClient && (
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleGetLiveLocation}
              disabled={isGettingLocation}
              className="border-pink-200 text-pink-700 hover:bg-pink-50 bg-transparent"
            >
              {isGettingLocation ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Navigation className="w-4 h-4 mr-2" />
              )}
              {isGettingLocation ? "Detecting..." : "Get Live Location"}
            </Button>
            
            {locationStatus !== "idle" && (
              <div className="flex items-center gap-2">
                {getStatusIcon()}
                <Badge 
                  variant={locationStatus === "success" ? "default" : "destructive"}
                  className="text-xs"
                >
                  {getStatusText()}
                </Badge>
              </div>
            )}
          </div>
        )}

        {/* Manual Input Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="address">Street Address *</Label>
            <Input
              id="address"
              placeholder="123 Main Street"
              value={manualInput.address}
              onChange={(e) => handleManualInputChange("address", e.target.value)}
              className="border-pink-200 focus:border-pink-400 focus:ring-pink-400"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="city">City *</Label>
            <Input
              id="city"
              placeholder="New York"
              value={manualInput.city}
              onChange={(e) => handleManualInputChange("city", e.target.value)}
              className="border-pink-200 focus:border-pink-400 focus:ring-pink-400"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="state">State *</Label>
            <Input
              id="state"
              placeholder="NY"
              value={manualInput.state}
              onChange={(e) => handleManualInputChange("state", e.target.value)}
              className="border-pink-200 focus:border-pink-400 focus:ring-pink-400"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="zipCode">ZIP Code</Label>
            <Input
              id="zipCode"
              placeholder="10001"
              value={manualInput.zipCode}
              onChange={(e) => handleManualInputChange("zipCode", e.target.value)}
              className="border-pink-200 focus:border-pink-400 focus:ring-pink-400"
            />
          </div>
        </div>

        {/* Geocode Manual Address Button */}
        {hasValidManualInput && (
          <div className="flex justify-center">
            <Button
              type="button"
              variant="outline"
              onClick={handleGeocodeManualAddress}
              disabled={isGeocoding}
              className="border-blue-200 text-blue-700 hover:bg-blue-50 bg-transparent"
            >
              {isGeocoding ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Search className="w-4 h-4 mr-2" />
              )}
              {isGeocoding ? "Geocoding..." : "Get Coordinates for Address"}
            </Button>
          </div>
        )}

        {/* Find Doctors Button */}
        {(locationData.coordinates || hasValidManualInput) && onFindDoctors && (
          <div className="flex justify-center">
            <Button
              type="button"
              onClick={() => {
                if (locationData.coordinates) {
                  onFindDoctors(locationData.coordinates)
                } else if (hasValidManualInput) {
                  // If no coordinates but valid manual input, try to geocode first
                  handleGeocodeManualAddress().then(() => {
                    if (locationData.coordinates) {
                      onFindDoctors(locationData.coordinates)
                    } else {
                      toast.error("Unable to find coordinates for the address. Please try the geocode button first.")
                    }
                  })
                }
              }}
              className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white"
            >
              🔍 Find Dermatologists Near Me
            </Button>
          </div>
        )}

        {/* Coordinates Display */}
        {isClient && locationData.coordinates && (
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-sm text-gray-600 mb-2">Detected Coordinates:</p>
            <div className="flex gap-4 text-sm">
              <span>
                <strong>Latitude:</strong> {locationData.coordinates.latitude.toFixed(6)}
              </span>
              <span>
                <strong>Longitude:</strong> {locationData.coordinates.longitude.toFixed(6)}
              </span>
            </div>
          </div>
        )}

        {/* Help Text */}
        <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg border border-blue-100">
          <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-blue-700">
            {isClient ? (
              <>
                Use the "Get Live Location" button to automatically detect your current location, 
                or manually enter your address details above. You can also get coordinates for your manual address 
                using the "Get Coordinates for Address" button. This information helps us find the nearest clinic for your appointment.
              </>
            ) : (
              <>
                Please wait for the page to load completely, then you can use the "Get Live Location" button 
                to automatically detect your current location, or manually enter your address details above. 
                This information helps us find the nearest clinic for your appointment.
              </>
            )}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
