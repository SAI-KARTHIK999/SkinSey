"use client"
import { useState, useEffect, useMemo, useRef,useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Calendar, Clock, MapPin, Star, CheckCircle, User, FileText } from "lucide-react"
import Link from "next/link"
import { ChanseyFAB } from "@/components/chansey-fab"
import { ChanseyMascot } from "@/components/chansey-mascot"
import { LocationInput } from "@/components/location-input"
import { toast } from "sonner"
import { LocationCoordinates } from "@/lib/geolocation"

/** -----------------------------------------
 * Initials helpers
 * ----------------------------------------- */
function getInitials(input?: string | null) {
  if (!input) return "NA"
  const clean = input
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean)

  // UPDATED: first letter of every word, joined (no max length)
  return clean.map(word => word[0]).join("").toUpperCase()
}

function splitLocation(location?: string | null) {
  if (!location || typeof location !== "string") return { line1: "Location", line2: "" }
  const parts = location.split(",")
  const line1 = parts[0]?.trim() || "Location"
  const line2 = parts.slice(1).join(",").trim()
  return { line1, line2 }
}

// -----------------------------------------
// Types
// -----------------------------------------

type Doctor = {
  id: string
  name: string
  specialty: string
  rating: number
  reviews: number
  location: string
  image?: string
  nextAvailable: string
  price: string
  distance?: string
  realData?: boolean
}

// -----------------------------------------
// Component
// -----------------------------------------

export default function BookAppointmentPage() {
  const [selectedDoctor, setSelectedDoctor] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<string>("")
  const [selectedTime, setSelectedTime] = useState<string>("")
  const [appointmentType, setAppointmentType] = useState<string>("")
  const [isBooking, setIsBooking] = useState(false)
  const [bookingComplete, setBookingComplete] = useState(false)
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [isLoadingDoctors, setIsLoadingDoctors] = useState(false)
  const [location, setLocation] = useState<{
    address: string
    city: string
    state: string
    zipCode: string
    coordinates: LocationCoordinates | null
  }>(
    {
      address: "",
      city: "",
      state: "",
      zipCode: "",
      coordinates: null
    }
  )


  // Function to fetch nearby doctors based on location
  const fetchNearbyDoctors = useCallback(async (coordinates: LocationCoordinates) => {

    setIsLoadingDoctors(true)
    try {
      const response = await fetch(
        `/api/doctors/nearby?lat=${coordinates.latitude}&lng=${coordinates.longitude}`
      )

      if (!response.ok) {
        throw new Error("Failed to fetch nearby doctors")
      }

      const data = await response.json()
      setDoctors(data.doctors)

      if (data.message) {
        if (data.realDataCount > 0) {
          if (data.realDataCount >= 3) {
            toast.success(`Found ${data.realDataCount} dermatologists near you.`)
          } else {
            toast.success(`Found ${data.realDataCount} clinics + ${data.fallbackCount || 0} nearby options`)
          }
        } else {
          toast.info(`Showing ${data.fallbackCount || data.doctors.length} nearby dermatologists`)
        }
      }
    } catch (error) {
      console.error("Error fetching nearby doctors:", error)
      toast.error("Unable to find nearby doctors. Showing default options.")
      setDoctors([
        {
          id: "1",
          name: "Dr. Sarah Johnson",
          specialty: "Dermatologist",
          rating: 4.9,
          reviews: 127,
          location: "Downtown Medical Center, MG Road, Mumbai",
          image: "/api/placeholder/150/150?text=DR",
          nextAvailable: "Tomorrow",
          price: "₹1,500",
          distance: "2.3",
        },
        {
          id: "2",
          name: "Dr. Michael Chen",
          specialty: "Cosmetic Dermatologist",
          rating: 4.8,
          reviews: 89,
          location: "Skin Care Clinic, Park Street, Delhi",
          image: "/api/placeholder/150/150?text=DR",
          nextAvailable: "Dec 16",
          price: "₹2,000",
          distance: "4.1",
        },
        {
          id: "3",
          name: "Dr. Emily Rodriguez",
          specialty: "Pediatric Dermatologist",
          rating: 4.9,
          reviews: 156,
          location: "Children's Medical Center, Connaught Place, Bangalore",
          image: "/api/placeholder/150/150?text=DR",
          nextAvailable: "Dec 18",
          price: "₹1,750",
          distance: "1.8",
        }
      ])
    } finally {
      setIsLoadingDoctors(false)
    }
  }, [setDoctors, setIsLoadingDoctors])

  // ---------------------------------------
  // 🔧 Auto-detect current location (safe fallback)
  // ---------------------------------------
  const triedGeoRef = useRef(false)
  const [isClient, setIsClient] = useState(false)

  // Ensure we're on the client side
  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (!isClient) return
    if (triedGeoRef.current) return
    if (location.coordinates) return

    const run = async () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const perm = (navigator as any).permissions?.query?.({ name: "geolocation" as any })
        const state = perm ? (await perm).state : "prompt"

        if (state === "denied") {
          triedGeoRef.current = true
          return
        }

        if ("geolocation" in navigator) {
          triedGeoRef.current = true
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              const { latitude, longitude } = pos.coords
              setLocation((prev) => ({
                ...prev,
                coordinates: { latitude, longitude },
              }))
              toast.success("Using your current location")
            },
            (err) => {
              console.warn("Geolocation error:", err)
              if (err.code === err.PERMISSION_DENIED) {
                toast.error("Location permission denied. You can still enter your address manually.")
              } else {
                toast.error("Unable to access current location. Enter address manually.")
              }
            },
            { enableHighAccuracy: true, maximumAge: 30000, timeout: 10000 }
          )
        }
      } catch (e) {
        console.warn("Geolocation check failed:", e)
      }
    }

    run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isClient])

  // Fetch nearby doctors when location coordinates are available
  useEffect(() => {
    if (location.coordinates) {
      fetchNearbyDoctors(location.coordinates!)
    }
  }, [location.coordinates, fetchNearbyDoctors])

  const selectedDoctorData = useMemo(
    () => doctors.find((d) => d.id === selectedDoctor) || null,
    [doctors, selectedDoctor]
  )

  const timeSlots = [
    "9:00 AM",
    "9:30 AM",
    "10:00 AM",
    "10:30 AM",
    "11:00 AM",
    "11:30 AM",
    "2:00 PM",
    "2:30 PM",
    "3:00 PM",
    "3:30 PM",
    "4:00 PM",
    "4:30 PM",
  ]

  const handleBookAppointment = useCallback(async () => {
    if (!selectedDoctor || !selectedDate || !selectedTime || !appointmentType) {
      toast.error("Please fill in all required fields")
      return
    }

    // Check if we have either coordinates or manual address input
    const hasCoordinates = location.coordinates !== null
    const hasManualAddress = location.address && location.city && location.state
    
    if (!hasCoordinates && !hasManualAddress) {
      toast.error("Please provide your location (either via GPS or manual address)")
      return
    }

    // Debug: Log the current state
    console.log("Booking attempt with:", {
      selectedDoctor,
      selectedDate,
      selectedTime,
      appointmentType,
      location
    })

    setIsBooking(true)

    try {
      const selectedDoctorDataLocal = doctors.find(d => d.id === selectedDoctor)
      if (!selectedDoctorDataLocal) {
        throw new Error("Doctor not found")
      }

      const response = await fetch("/api/appointments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          doctorId: selectedDoctor,
          doctorName: selectedDoctorDataLocal.name,
          doctorSpecialty: selectedDoctorDataLocal.specialty,
          date: selectedDate,
          time: selectedTime,
          appointmentType,
          phone: (document.getElementById("phone") as HTMLInputElement)?.value || "",
          notes: (document.getElementById("notes") as HTMLTextAreaElement)?.value || "",
          location: {
            address: location.address || "Location set via coordinates",
            city: location.city || "Location set via coordinates",
            state: location.state || "Location set via coordinates",
            zipCode: location.zipCode || "Location set via coordinates",
          },
          coordinates: location.coordinates
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to book appointment")
      }

      await response.json()
      toast.success("Appointment booked successfully!")
      setBookingComplete(true)
      
      // Redirect to full-dashboard after a short delay to show the new appointment
      setTimeout(() => {
        window.location.href = '/full-dashboard'
      }, 2000)
    } catch (error) {
      console.error("Error booking appointment:", error)
      toast.error(error instanceof Error ? error.message : "Failed to book appointment")
    } finally {
      setIsBooking(false)
    }
  }, [selectedDoctor, selectedDate, selectedTime, appointmentType, location, doctors, setIsBooking, setBookingComplete])

  // ---------------------------------------
  // Confirmation Screen
  // ---------------------------------------
  if (bookingComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50 flex items-center justify-center p-4">
        <Card className="border-pink-100 shadow-xl bg-white/90 backdrop-blur-sm max-w-md w-full">
          <CardContent className="text-center p-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Appointment Booked!</h2>

            {selectedDoctorData && (
              <div className="flex items-center justify-center gap-3 mb-3">
                <Avatar className="w-10 h-10 border-2 border-green-100 shadow">
                  <AvatarImage src={selectedDoctorData.image || ""} />
                  <AvatarFallback className="bg-gradient-to-r from-emerald-500 to-green-600 text-white text-sm font-semibold">
                    {getInitials(selectedDoctorData.name)}
                  </AvatarFallback>
                </Avatar>
                <p className="text-gray-700">
                  with <span className="font-semibold">{selectedDoctorData.name}</span>
                </p>
              </div>
            )}

            <p className="text-gray-600 mb-6">
              Your appointment has been successfully scheduled.
            </p>
            <div className="space-y-2 text-sm text-gray-600 mb-6">
              <p>
                <strong>Date:</strong> {selectedDate}
              </p>
              <p>
                <strong>Time:</strong> {selectedTime}
              </p>
              <p>
                <strong>Type:</strong> {appointmentType}
              </p>
              {location.address && (
                <p>
                  <strong>Location:</strong> {location.address}, {location.city}, {location.state} {location.zipCode}
                </p>
              )}
            </div>
            <div className="space-y-3">
              <Button
                className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white rounded-full"
                asChild
              >
                <Link href="/dashboard">Back to Dashboard</Link>
              </Button>
              <Button
                variant="outline"
                className="w-full border-pink-200 text-pink-700 hover:bg-pink-50 bg-transparent"
              >
                Add to Calendar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ---------------------------------------
  // Main Screen
  // ---------------------------------------
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-pink-100 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 text-pink-600 hover:text-pink-700 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Dashboard
            </Link>
            <div className="flex items-center gap-2">
              <ChanseyMascot size="sm" />
              <h1 className="text-xl font-bold text-gray-800">Book Appointment</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Top: Title only */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-rose-500 rounded-full flex items-center justify-center">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-4xl font-bold text-gray-800">Schedule Your Consultation</h2>
            </div>
          </div>

          {/* Progress Steps */}
          <div className="mb-6">
            <div className="flex items-center justify-center mb-3">
              <div className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold ${(location.coordinates || (location.address && location.city && location.state)) ? 'bg-green-500 text-white' : 'bg-pink-500 text-white'}`}>
                  {(location.coordinates || (location.address && location.city && location.state)) ? '✓' : '1'}
                </div>
                <div className={`w-16 h-1 ${(location.coordinates || (location.address && location.city && location.state)) ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold ${selectedDoctor ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'}`}>
                  {selectedDoctor ? '✓' : '2'}
                </div>
                <div className={`w-16 h-1 ${selectedDoctor ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold ${selectedDate && selectedTime ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'}`}>
                  {selectedDate && selectedTime ? '✓' : '3'}
                </div>
              </div>
            </div>
            <div className="flex items-center justify-center gap-8 text-sm text-gray-600">
              <span className={(location.coordinates || (location.address && location.city && location.state)) ? 'text-green-600 font-medium' : ''}>Set Location</span>
              <span className={selectedDoctor ? 'text-green-600 font-medium' : ''}>Choose Doctor</span>
              <span className={selectedDate && selectedTime ? 'text-green-600 font-medium' : ''}>Book Time</span>
            </div>
          </div>

          {/* Location Input (directly after steps, no extra copy) */}
          <div className="mb-8 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-pink-100/20 to-rose-100/20 rounded-2xl -z-10"></div>

            <LocationInput
              onLocationChange={setLocation}
              onFindDoctors={fetchNearbyDoctors}
              initialLocation={location}
            />

            {(location.coordinates || (location.address && location.city && location.state)) && (
              <div className="mt-4 text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-full">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-700 font-medium">
                    Location Set: {location.city}, {location.state}
                    {!location.coordinates && " (Manual Input)"}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Doctor Selection */}
            <div className="lg:col-span-2">
              <Card className="border-pink-100 mb-6 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-pink-50 to-rose-50 border-b border-pink-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-pink-500 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-2xl text-gray-800">Choose Your Dermatologist</CardTitle>
                        <CardDescription className="text-base">Select a nearby specialist</CardDescription>
                      </div>
                    </div>
                    {(location.coordinates || (location.address && location.city && location.state)) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (location.coordinates) {
                            fetchNearbyDoctors(location.coordinates!)
                          } else {
                            toast.info("Please use the 'Get Coordinates for Address' button first to find nearby doctors.")
                          }
                        }}
                        disabled={isLoadingDoctors}
                        className="border-pink-200 text-pink-700 hover:bg-pink-50 shadow-sm"
                      >
                        Refresh
                      </Button>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {isLoadingDoctors ? (
                    <div className="text-center py-12">
                      <div className="relative mb-6">
                        <div className="w-16 h-16 border-4 border-pink-200 rounded-full mx-auto"></div>
                        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-16 h-16 border-4 border-pink-600 rounded-full animate-spin border-t-transparent"></div>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">Searching for dermatologists…</h3>
                      <p className="text-gray-600 mb-3">Looking for clinics and hospitals near your location</p>
                    </div>
                  ) : !location.coordinates && !(location.address && location.city && location.state) ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500">Please provide your location above to find nearby dermatologists.</p>
                    </div>
                  ) : doctors.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500">No dermatologists found. Please try a different location.</p>
                    </div>
                  ) : (
                    doctors.map((doctor) => {
                      const { line1, line2 } = splitLocation(doctor.location)
                      return (
                        <div
                          key={doctor.id}
                          className={`p-6 border-2 rounded-xl cursor-pointer transition-all hover:shadow-md ${
                            selectedDoctor === doctor.id
                              ? "border-pink-400 bg-gradient-to-r from-pink-50 to-rose-50 shadow-lg"
                              : "border-pink-100 hover:border-pink-300"
                          }`}
                          onClick={() => setSelectedDoctor(doctor.id)}
                        >
                          <div className="flex items-start gap-4">
                            <Avatar className="w-20 h-20 border-4 border-white shadow-md">
                              <AvatarImage src={doctor.image || "/placeholder.svg"} />
                              <AvatarFallback className="bg-gradient-to-r from-pink-500 to-rose-500 text-white text-lg font-bold">
                                {getInitials(doctor.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-1">
                                <h3 className="text-xl font-bold text-gray-800">{doctor.name}</h3>
                              </div>
                              <p className="text-base text-gray-600 mb-3">{doctor.specialty}</p>

                              <div className="grid grid-cols-2 gap-4">
                                <div className="flex items-center gap-2">
                                  <Star className="w-5 h-5 text-yellow-400 fill-current" />
                                  <div>
                                    <div className="font-semibold text-gray-800">{doctor.rating}</div>
                                    <div className="text-xs text-gray-500">{doctor.reviews} reviews</div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <MapPin className="w-5 h-5 text-blue-500" />
                                  <div>
                                    <div className="font-semibold text-gray-800">{line1}</div>
                                    <div className="text-xs text-gray-500">{line2}</div>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold text-pink-600 mb-1">{doctor.price}</div>
                              <div className="text-xs text-gray-500">Consultation Fee</div>
                            </div>
                          </div>
                        </div>
                      )
                    })
                  )}
                </CardContent>
              </Card>
            </div>

            {/* RIGHT: Combined Date & Time + Booking Summary (stacked inside one sticky card) */}
            <div>
              <Card className="border-pink-100 sticky top-24 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-pink-50 to-rose-50 border-b border-pink-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-pink-500 rounded-full flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl text-gray-800">Select Date & Time</CardTitle>
                      <CardDescription className="text-base">Choose your preferred appointment slot</CardDescription>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  {selectedDoctor ? (
                    <>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="date">Preferred Date</Label>
                          <Input
                            id="date"
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            min={new Date().toISOString().split("T")[0]}
                            className="border-pink-200 focus:border-pink-400 focus:ring-pink-400"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="appointment-type">Appointment Type</Label>
                          <Select value={appointmentType} onValueChange={setAppointmentType}>
                            <SelectTrigger className="border-pink-200 focus:border-pink-400 focus:ring-pink-400">
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="consultation">General Consultation</SelectItem>
                              <SelectItem value="follow-up">Follow-up Visit</SelectItem>
                              <SelectItem value="acne-treatment">Acne Treatment</SelectItem>
                              <SelectItem value="skin-screening">Skin Screening</SelectItem>
                              <SelectItem value="cosmetic">Cosmetic Consultation</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {selectedDate && (
                        <div className="space-y-2">
                          <Label>Available Time Slots</Label>
                          <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                            {timeSlots.map((time) => (
                              <Button
                                key={time}
                                variant={selectedTime === time ? "default" : "outline"}
                                size="sm"
                                onClick={() => setSelectedTime(time)}
                                className={
                                  selectedTime === time
                                    ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white"
                                    : "border-pink-200 text-pink-700 hover:bg-pink-50 bg-transparent"
                                }
                              >
                                {time}
                              </Button>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="h-px bg-pink-100 my-2" />

                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-pink-500 rounded-full flex items-center justify-center">
                          <FileText className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-gray-800">Booking Summary</h3>
                          <p className="text-sm text-gray-600">Review your appointment details</p>
                        </div>
                      </div>

                      <div className="space-y-4 pt-2">
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <Avatar className="w-8 h-8 border">
                              <AvatarImage src={selectedDoctorData?.image || ""} />
                              <AvatarFallback className="bg-pink-100 text-pink-700 text-xs font-semibold">
                                {getInitials(selectedDoctorData?.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-gray-800">
                                {selectedDoctorData?.name}
                              </p>
                              <p className="text-sm text-gray-600">
                                {selectedDoctorData?.specialty}
                              </p>
                            </div>
                          </div>

                          {selectedDate && (
                            <div className="flex items-center gap-3">
                              <Calendar className="w-4 h-4 text-pink-600" />
                              <div>
                                <p className="font-medium text-gray-800">{selectedDate}</p>
                                <p className="text-sm text-gray-600">Date</p>
                              </div>
                            </div>
                          )}

                          {selectedTime && (
                            <div className="flex items-center gap-3">
                              <Clock className="w-4 h-4 text-pink-600" />
                              <div>
                                <p className="font-medium text-gray-800">{selectedTime}</p>
                                <p className="text-sm text-gray-600">Time</p>
                              </div>
                            </div>
                          )}

                          {appointmentType && (
                            <div className="flex items-center gap-3">
                              <FileText className="w-4 h-4 text-pink-600" />
                              <div>
                                <p className="font-medium text-gray-800 capitalize">{appointmentType.replace("-", " ")}</p>
                                <p className="text-sm text-gray-600">Type</p>
                              </div>
                            </div>
                          )}

                          {location.address && (
                            <div className="flex items-center gap-3">
                              <MapPin className="w-4 h-4 text-pink-600" />
                              <div>
                                <p className="font-medium text-gray-800">
                                  {location.address}, {location.city}, {location.state} {location.zipCode}
                                </p>
                                <p className="text-sm text-gray-600">Location</p>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="border-t border-pink-100 pt-4">
                          <div className="flex justify-between items-center mb-4">
                            <span className="font-medium text-gray-800">Total Cost:</span>
                            <span className="text-xl font-bold text-pink-600">
                              {selectedDoctorData?.price}
                            </span>
                          </div>

                          <div className="space-y-3">
                            <div className="space-y-2">
                              <Label htmlFor="phone">Phone Number</Label>
                              <Input
                                id="phone"
                                type="tel"
                                placeholder="(555) 123-4567"
                                className="border-pink-200 focus:border-pink-400 focus:ring-pink-400"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="notes">Additional Notes (Optional)</Label>
                              <Textarea
                                id="notes"
                                placeholder="Any specific concerns or questions..."
                                className="border-pink-200 focus:border-pink-400 focus:ring-pink-400"
                                rows={3}
                              />
                            </div>
                          </div>

                          <Button
                            onClick={handleBookAppointment}
                            disabled={
                              !selectedDate ||
                              !selectedTime ||
                              !appointmentType ||
                              !location.address ||
                              !location.city ||
                              !location.state ||
                              isBooking
                            }
                            className="w-full mt-4 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white rounded-full py-3 font-semibold shadow-lg"
                          >
                            {isBooking ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Booking...
                              </>
                            ) : (
                              "Confirm Booking"
                            )}
                          </Button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-10">
                      <p className="text-gray-500">Select a dermatologist to choose date & time and see the summary here.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
      {/* Floating Chansey AI Button */}
      <ChanseyFAB />
    </div>
  )
}

