/**
 * NoSlip — AI Hype and Roast Generator
 *
 * Calls the free Google Gemini Flash API (gemini-flash-latest) with
 * resilient 3-second timeouts and friendly fallback messages.
 */

const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent';

export const HYPE_FALLBACKS = [
  "Tree's looking good today.",
  'Another one in the books.',
  "Streak's still climbing.",
];

export const ROAST_FALLBACKS = [
  "Rough one. Tree'll survive.",
  'Well, that happened.',
  "Back to day one, let's go.",
];

function getRandomFallback(list: string[]): string {
  const index = Math.floor(Math.random() * list.length);
  return list[index] || list[0];
}

/**
 * Generates a short celebratory hype line for a successful check-in.
 */
export async function generateHypeMessage(streakCount: number): Promise<string> {
  const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) {
    return getRandomFallback(HYPE_FALLBACKS);
  }

  const systemInstruction = `You are a witty, supportive friend writing one short hype line for someone who just logged a sugar-free day in their habit-tracking app. Under 20 words, casual, max one emoji. Never mention weight, body, or health — just celebrate the streak. Reference the day count if given: Day ${streakCount}.`;

  try {
    const text = await callGeminiWithTimeout(apiKey, systemInstruction);
    return text || getRandomFallback(HYPE_FALLBACKS);
  } catch (err) {
    console.warn('AI hype generation failed, using fallback:', err);
    return getRandomFallback(HYPE_FALLBACKS);
  }
}

/**
 * Generates a playful, affectionate roast line when a streak breaks.
 */
export async function generateRoastMessage(
  streakLength: number,
  stake: string | null,
): Promise<string> {
  const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) {
    return getRandomFallback(ROAST_FALLBACKS);
  }

  const safeStake = stake && stake.trim().length > 0 ? stake.trim() : 'no stake declared';
  const systemInstruction = `You are a witty, affectionate friend writing one short roast for someone who just broke their sugar-cut streak. Under 20 words, playful teasing like close friends give each other, never actually mean, never mention weight/body/health. "You had one job" energy, not "you're weak" energy. Their streak was ${streakLength} days, stake was "${safeStake}".`;

  try {
    const text = await callGeminiWithTimeout(apiKey, systemInstruction);
    return text || getRandomFallback(ROAST_FALLBACKS);
  } catch (err) {
    console.warn('AI roast generation failed, using fallback:', err);
    return getRandomFallback(ROAST_FALLBACKS);
  }
}

/**
 * Helper to call Gemini REST API with an abort controller timeout (~3s).
 */
async function callGeminiWithTimeout(
  apiKey: string,
  systemInstruction: string,
): Promise<string | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3200);

  try {
    const response = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: systemInstruction }],
        },
        contents: [
          {
            role: 'user',
            parts: [{ text: 'Generate the line.' }],
          },
        ],
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Gemini API returned status ${response.status}`);
    }

    const data = await response.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawText) return null;

    // Clean up quotes and trailing newlines
    let cleanText = rawText.trim();
    if (
      (cleanText.startsWith('"') && cleanText.endsWith('"')) ||
      (cleanText.startsWith("'") && cleanText.endsWith("'"))
    ) {
      cleanText = cleanText.slice(1, -1).trim();
    }

    return cleanText;
  } finally {
    clearTimeout(timeoutId);
  }
}
