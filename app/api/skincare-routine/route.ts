import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

type RoutineRequest = {
  skinType: string;
  score: number;
  climate: string;
  skinConcerns: string[];
  steps: number;
  times: number;
};

export async function POST(req: Request) {
  const body: RoutineRequest = await req.json();
  const { skinType, score, climate, skinConcerns, steps, times } = body;

  const prompt = `
Generate a personalized skincare routine.

Details:
- Skin Type: ${skinType}
- Sensitivity Score: ${score}
- Climate: ${climate}
- Skin Concerns: ${skinConcerns.join(", ")}
- Routine Length: ${steps} steps
- Times per day: ${times}

Output JSON Format ONLY (no text, no markdown):
{
  "morningRoutine": ["step1", "step2", ...],
  "eveningRoutine": ["step1", "step2", ...],
  "motivationalNote": "Some note"
}
`;

  const result = await model.generateContent(prompt);
  let rawText = result.response.text();

  // Strip markdown code fences if they exist
  rawText = rawText.replace(/```json/g, "").replace(/```/g, "").trim();

  try {
    const jsonResponse = JSON.parse(rawText);
    return new Response(JSON.stringify(jsonResponse), { status: 200 });
  } catch (err) {
    console.error("JSON parse error:", err, "raw:", rawText);
    return new Response(
      JSON.stringify({ 
        error: "Failed to parse AI response",
        raw: rawText
      }),
      { status: 500 }
    );
  }
}
