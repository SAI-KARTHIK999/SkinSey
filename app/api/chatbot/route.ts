import { NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "")

// Helper: retry on 429 errors
async function safeGenerate(model: any, options: any) {
  try {
    return await model.generateContent(options)
  } catch (err: any) {
    if (err.status === 429) {
      const retryDelay =
        err.errorDetails?.find((d: any) => d["@type"]?.includes("RetryInfo"))
          ?.retryDelay || "10s"

      const delayMs = parseInt(retryDelay) * 1000 || 10000
      console.warn(`Rate limit hit. Retrying after ${delayMs / 1000}s...`)
      await new Promise((r) => setTimeout(r, delayMs))
      return await model.generateContent(options)
    }
    throw err
  }
}

export async function POST(request: NextRequest) {
  try {
    const { message, conversationHistory } = await request.json()

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      )
    }

    // System prompt
    const systemPrompt = `You are Skinsey, a professional dermatologist AI assistant. 
Your role is to:
1. Provide accurate info about skin conditions and skin care
2. Offer prevention tips and general advice
3. Be empathetic and professional
4. Always recommend consulting a real dermatologist for serious conditions
5. Use simple, clear language
6. Add Indian context when relevant (climate, common skin issues)
7. Try to answer in points, and not long paragraphs to make it easier for user to read
8. Keep answers concise.
IMPORTANT: Always remind users you are an AI, not a doctor.`



    // Build base conversation
    const conversation: any[] = [
      { role: "user", parts: [{ text: systemPrompt }] },
      {
        role: "model",
        parts: [
          {
            text: "Hello! I'm Chansey, your AI dermatology assistant. I can provide general skin care advice and information about skin conditions. Please remember I'm not a substitute for a real dermatologist. How can I help you today?",
          },
        ],
      },
    ]

    // Add limited history (last 4 messages max to save tokens)
    if (conversationHistory && conversationHistory.length > 0) {
      const recentHistory = conversationHistory.slice(-4)
      conversation.push(...recentHistory)
    }

    // Add new user message
    conversation.push({ role: "user", parts: [{ text: message }] })

    // Use Gemini Flash model (cheaper + faster + higher quota)
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

    // Generate response with retry logic
    const result = await safeGenerate(model, {
      contents: conversation,
      generationConfig: {
        maxOutputTokens: 500,
        temperature: 0.7,
        topP: 0.8,
        topK: 40,
      },
    })

    const aiMessage = result.response.text()

    return NextResponse.json({
      message: aiMessage,
      timestamp: new Date().toISOString(),
      conversationId: Date.now().toString(),
    })
  } catch (error) {
    console.error("Chatbot API error:", error)
    return NextResponse.json(
      {
        error: "Failed to generate response",
        message:
          "I'm sorry, I'm having trouble responding right now. Please try again later.",
      },
      { status: 500 }
    )
  }
}
