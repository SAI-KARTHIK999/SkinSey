import { NextRequest, NextResponse } from "next/server"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ width: string; height: string }> }
) {
  const { searchParams } = new URL(request.url)
  const text = searchParams.get("text") || "DR"
  const resolvedParams = await params
  const width = parseInt(resolvedParams.width) || 150
  const height = parseInt(resolvedParams.height) || 150

  // Create a simple SVG placeholder with doctor initials
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#fce7f3;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#fbcfe8;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#grad)" rx="8"/>
      <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="${Math.min(width, height) * 0.3}" 
            font-weight="bold" text-anchor="middle" dy=".3em" fill="#be185d">
        ${text}
      </text>
    </svg>
  `

  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=31536000",
    },
  })
}
