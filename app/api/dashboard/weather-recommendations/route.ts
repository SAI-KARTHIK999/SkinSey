import { NextResponse } from "next/server"

// Type definitions
type CurrentWeather = {
  temperature: number
  humidity: number
  condition: string
  uvIndex: number
  windSpeed: number
}

type TimeBasedRoutine = {
  morning: string[]
  afternoon: string[]
  evening: string[]
  night: string[]
}

// Utility: Determine season by month
function getSeason(month: number): "Summer" | "Monsoon" | "Winter" {
  if (month >= 3 && month <= 5) return "Summer"
  if (month >= 6 && month <= 9) return "Monsoon"
  return "Winter"
}

const getTimeBasedRoutine = (weather: CurrentWeather): TimeBasedRoutine => {
  const isHot = weather.temperature > 28
  const isCold = weather.temperature < 18
  const isHumid = weather.humidity > 70
  const isDry = weather.humidity < 30
  const isSunny = weather.uvIndex > 5

  return {
    morning: [
      "Cleanse your face with a gentle cleanser",
      isSunny ? "Apply broad spectrum SPF 50+" : "Apply SPF 30+",
      isDry ? "Use a hydrating serum before sunscreen" : "",
      isHot ? "Consider a lightweight moisturizer" : ""
    ].filter(Boolean),

    afternoon: [
      isSunny ? "Reapply sunscreen every 2 hours" : "",
      isHumid ? "Blot excess oil with blotting papers" : "",
      "Stay hydrated by drinking water",
      isHot ? "Use a cooling facial mist" : ""
    ].filter(Boolean),

    evening: [
      "Double cleanse to remove sunscreen/makeup",
      isSunny ? "Apply aloe vera or soothing gel" : "",
      isDry ? "Use a hydrating toner" : "",
      "Apply antioxidant serum"
    ].filter(Boolean),

    night: [
      isSunny ? "Use a repairing night cream" : "Apply night moisturizer",
      "Use retinol/niacinamide (if part of routine)",
      isCold ? "Apply a richer moisturizer" : "",
      "Get 7-8 hours of quality sleep"
    ].filter(Boolean)
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const lat = searchParams.get("lat")
    const lon = searchParams.get("lon")
    const city = searchParams.get("city") || "Kolkata" // fallback

    const apiKey = process.env.WEATHER_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing OpenWeather API Key" },
        { status: 500 }
      )
    }

    // Fetch weather (lat/lon preferred, fallback to city)
    const weatherUrl = lat && lon
      ? `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`
      : `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`

    const weatherRes = await fetch(weatherUrl)
    if (!weatherRes.ok) {
      return NextResponse.json(
        { error: "Failed to fetch weather" },
        { status: 500 }
      )
    }
    const weatherJson = await weatherRes.json()

    const currentWeather: CurrentWeather = {
      temperature: weatherJson.main.temp,
      humidity: weatherJson.main.humidity,
      condition: weatherJson.weather[0]?.main || "Clear",
      uvIndex: 0, // default since free API does not provide UV directly
      windSpeed: weatherJson.wind?.speed || 0
    }

    // Build time-based routine
    const timeBasedRoutine = getTimeBasedRoutine(currentWeather)

    // Weather-based tips
    const tips: string[] = []
    if (currentWeather.temperature > 32)
      tips.push("Stay hydrated and avoid direct sun exposure")
    if (currentWeather.temperature < 18)
      tips.push("Use a rich moisturizer to prevent dryness")
    if (currentWeather.humidity > 70)
      tips.push("Opt for lightweight, non-comedogenic skincare")
    if (currentWeather.humidity < 30)
      tips.push("Use a humidifier and hydrating serums")
    if (currentWeather.uvIndex > 6)
      tips.push("Wear wide-brimmed hat and seek shade when possible")

    // Seasonal tips
    const now = new Date()
    const season = getSeason(now.getMonth() + 1)
    let seasonal: string[] = []
    if (season === "Summer") {
      seasonal = [
        "Always wear sunscreen SPF 30+",
        "Use oil-control facewash",
        "Drink 8+ glasses of water daily",
      ]
    } else if (season === "Monsoon") {
      seasonal = [
        "Avoid heavy creams, go for gel-based moisturizers",
        "Keep your skin clean to prevent fungal infections",
        "Use waterproof sunscreen",
      ]
    } else if (season === "Winter") {
      seasonal = [
        "Use a thick moisturizer twice daily",
        "Avoid very hot showers (they dry skin)",
        "Apply lip balm regularly",
      ]
    }

    return NextResponse.json({
      city,
      currentWeather,
      recommendations: {
        immediate: tips,
        daily: seasonal,
        timeBased: timeBasedRoutine,
        seasonal,
      },
      riskFactors: [
        currentWeather.uvIndex > 6 ? "High UV exposure" : "",
        currentWeather.humidity > 80 ? "High humidity may cause breakouts" : "",
        currentWeather.temperature < 15 ? "Cold weather may dry skin" : ""
      ].filter(Boolean),
      tips
    })
  } catch (error) {
    console.error("Weather API Error:", error)
    return NextResponse.json(
      { error: "Something went wrong fetching weather" },
      { status: 500 }
    )
  }
}
