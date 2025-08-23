// app/api/analyze-skin/route.ts
import { NextRequest, NextResponse } from "next/server";
import { Groq } from "groq-sdk"; 
import { writeFile, unlink, mkdir } from "fs/promises";
import path from "path";

const UPLOAD_FOLDER = path.join(process.cwd(), "uploads");
const ALLOWED_EXTENSIONS = ["png", "jpg", "jpeg", "webp"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// Helper to check allowed file extension
function allowedFile(filename: string) {
  const ext = filename.split(".").pop()?.toLowerCase();
  return ext && ALLOWED_EXTENSIONS.includes(ext);
}

export async function POST(req: NextRequest) {
  try {
    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json(
        { error: "Server configuration error: GROQ_API_KEY not set" },
        { status: 500 }
      );
    }

    const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const formData = await req.formData();
    const file = formData.get("image") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No image file uploaded" }, { status: 400 });
    }

    if (!allowedFile(file.name)) {
      return NextResponse.json(
        { error: "Invalid file type. Only PNG, JPG, JPEG, WEBP allowed" },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Max size is ${MAX_FILE_SIZE / (1024 * 1024)}MB` },
        { status: 400 }
      );
    }

    // Ensure uploads folder exists
    await mkdir(UPLOAD_FOLDER, { recursive: true });

    // Save uploaded file temporarily
    const bytes = Buffer.from(await file.arrayBuffer());
    const filepath = path.join(UPLOAD_FOLDER, file.name);
    await writeFile(filepath, bytes);

    // Convert to Base64
    const image_b64 = bytes.toString("base64");

    // AI prompt
    const prompt = `**Skin Analysis Request**

You MUST format your response EXACTLY as follows:

===CONDITIONS===
1. [Condition Name]: [XX]% confidence  
2. [Condition Name]: [XX]% confidence  
(List up to 3 most likely conditions)

===RECOMMENDATIONS===
- Recommendation: [Specific advice 1]  
- Recommendation: [Specific advice 2]  
(Provide 3-5 specific recommendations)

===URGENT NOTES===
(Only include if applicable)  
- Urgent: [Critical warning]  

IMPORTANT: If you cannot confidently analyze the image, respond with:
===ERROR===
[Reason analysis cannot be completed]`;

    // Send request to Groq
    const response = await client.chat.completions.create({
      model: "meta-llama/llama-4-maverick-17b-128e-instruct",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${image_b64}`,
              },
            },
          ],
        },
      ],
      max_tokens: 1024,
    });

    const ai_message = response.choices[0]?.message?.content || "";

    // Cleanup temp file
    await unlink(filepath).catch(() => {});

    // Handle error format
    if (ai_message.includes("===ERROR===")) {
      const error_reason = ai_message.split("===ERROR===")[1]?.trim() || "Unknown";
      return NextResponse.json(
        { error: `AI analysis failed: ${error_reason}` },
        { status: 400 }
      );
    }

    // Parse sections
    const conditions: { name: string; confidence: number }[] = [];
    const recommendations: string[] = [];
    const urgent_notes: string[] = [];

    if (!(ai_message.includes("===CONDITIONS===") && ai_message.includes("===RECOMMENDATIONS==="))) {
      return NextResponse.json(
        { error: "AI response format invalid", raw_response: ai_message },
        { status: 500 }
      );
    }

    // Parse conditions
    const conditions_section = ai_message.split("===CONDITIONS===")[1].split("===")[0];
    for (const line of conditions_section.split("\n")) {
      const clean = line.trim();
      if (!clean || !clean.includes("%")) continue;
      try {
        const [left, right] = clean.split(":");
        const condition = left.replace(/^\d+\.\s*/, "").trim();
        const confidence = parseInt(right.replace("% confidence", "").trim());
        conditions.push({ name: condition, confidence });
      } catch {
        continue;
      }
    }

    // Parse recommendations
    const rec_section = ai_message.split("===RECOMMENDATIONS===")[1].split("===")[0];
    for (const line of rec_section.split("\n")) {
      const clean = line.trim();
      if (clean.startsWith("- Recommendation:")) {
        recommendations.push(clean.split(":")[1].trim());
      }
    }

    // Parse urgent notes
    if (ai_message.includes("===URGENT NOTES===")) {
      const urgent_section = ai_message.split("===URGENT NOTES===")[1].split("===")[0];
      for (const line of urgent_section.split("\n")) {
        const clean = line.trim();
        if (clean.startsWith("- Urgent:")) {
          urgent_notes.push(clean.split(":")[1].trim());
        }
      }
    }

    if (!conditions.length || !recommendations.length) {
      return NextResponse.json(
        { error: "Incomplete analysis results", raw_response: ai_message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      conditions,
      recommendations,
      urgent_notes,
      raw_response: ai_message,
    });
  } catch (err: any) {
    console.error("Error during analysis:", err);
    return NextResponse.json(
      { error: `An error occurred during analysis: ${err.message}` },
      { status: 500 }
    );
  }
}
