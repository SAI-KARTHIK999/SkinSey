export interface LocationCoordinates {
  latitude: number
  longitude: number
}

export interface LocationAddress {
  address: string
  city: string
  state: string
  zipCode: string
  country: string
}

export interface LocationData {
  coordinates: LocationCoordinates | null
  address: LocationAddress | null
}

// Get current location using browser geolocation API
export const getCurrentLocation = (): Promise<LocationCoordinates> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported by this browser"))
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        })
      },
      (error) => {
        reject(error)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    )
  })
}

// Reverse geocoding using OpenStreetMap Nominatim API
export const reverseGeocode = async (
  coordinates: LocationCoordinates
): Promise<LocationAddress> => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coordinates.latitude}&lon=${coordinates.longitude}&zoom=18&addressdetails=1`
    )
    
    if (!response.ok) {
      throw new Error("Failed to fetch address")
    }

    const data = await response.json()
    const address = data.address

    return {
      address: `${address.house_number || ""} ${address.road || ""}`.trim(),
      city: address.city || address.town || address.village || "",
      state: address.state || "",
      zipCode: address.postcode || "",
      country: address.country || "",
    }
  } catch (error) {
    console.error("Error in reverse geocoding:", error)
    throw new Error("Failed to get address from coordinates")
  }
}

// Get full location data (coordinates + address)
export const getFullLocation = async (): Promise<LocationData> => {
  try {
    const coordinates = await getCurrentLocation()
    const address = await reverseGeocode(coordinates)
    
    return {
      coordinates,
      address,
    }
  } catch (error) {
    console.error("Error getting full location:", error)
    return {
      coordinates: null,
      address: null,
    }
  }
}

// Validate coordinates
export const isValidCoordinates = (coordinates: LocationCoordinates): boolean => {
  return (
    coordinates.latitude >= -90 &&
    coordinates.latitude <= 90 &&
    coordinates.longitude >= -180 &&
    coordinates.longitude <= 180
  )
}

// Calculate distance between two coordinates (Haversine formula)
export const calculateDistance = (
  coord1: LocationCoordinates,
  coord2: LocationCoordinates
): number => {
  const R = 6371 // Earth's radius in kilometers
  const dLat = (coord2.latitude - coord1.latitude) * (Math.PI / 180)
  const dLon = (coord2.longitude - coord1.longitude) * (Math.PI / 180)
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(coord1.latitude * (Math.PI / 180)) *
      Math.cos(coord2.latitude * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}





