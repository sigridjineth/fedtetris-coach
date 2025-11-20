import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

// Default to FLock API, fallback to OpenAI if needed (or mock)
const FLOCK_BASE_URL = process.env.FLOCK_BASE_URL || "https://api.flock.io/v1";
const FLOCK_API_KEY = process.env.FLOCK_API_KEY;

if (!FLOCK_API_KEY || FLOCK_API_KEY.startsWith("dummy")) {
  console.warn("Warning: FLOCK_API_KEY is missing or dummy. AI features will be mocked.");
}

const client = new OpenAI({
  baseURL: FLOCK_BASE_URL,
  apiKey: FLOCK_API_KEY || "dummy-key", // Prevent crash on init
});

export interface StrategyAdvice {
  recommendedAction: "LEFT" | "RIGHT" | "ROTATE" | "DROP" | "HOLD";
  explanation: string;
}

export async function getFlockAdvice(
  stateSummary: any, 
  playerProfile: any
): Promise<StrategyAdvice> {
  const systemPrompt = `
You are a Tetris coach AI.
Given the current board state and possible actions,
you suggest the best action and explain why.
Return JSON only with the following format:
{
  "recommendedAction": "LEFT" | "RIGHT" | "ROTATE" | "DROP" | "HOLD",
  "explanation": "short explanation string"
}
`;

  const userPrompt = `
Current state (JSON):
${JSON.stringify(stateSummary)}

Player skill: ${playerProfile.level || "intermediate"} (${playerProfile.style || "balanced"})
`;

  try {
    // If using dummy key, throw immediately to skip timeout
    if (!FLOCK_API_KEY || FLOCK_API_KEY.startsWith("dummy")) {
        throw new Error("Using dummy key, skipping API call");
    }

    const completion = await client.chat.completions.create({
      model: "qwen-32b-instruct", 
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" }
    });

    const content = completion.choices[0].message.content;
    if (!content) throw new Error("Empty response from FLock");

    return JSON.parse(content) as StrategyAdvice;
  } catch (error) {
    console.error("FLock API Error (or Mocking):", error instanceof Error ? error.message : error);
    // Fallback/Mock for demo if API fails
    const actions = ["LEFT", "RIGHT", "ROTATE", "DROP"];
    const randomAction = actions[Math.floor(Math.random() * actions.length)];
    return {
      recommendedAction: randomAction as any,
      explanation: "AI is currently offline (Mock). Keep board flat!"
    };
  }
}