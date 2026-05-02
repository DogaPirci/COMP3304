import { GoogleGenerativeAI } from '@google/generative-ai';
import crypto from 'crypto';

export interface ImageClassificationResult {
    category: string;
    name: string;
    confidence: number;
}

export class GeminiService {
    private genAI: GoogleGenerativeAI;
    private static cache: Map<string, any> = new Map();

    constructor() {
        const apiKey = process.env.GEMINI_API_KEY || '';
        if (!apiKey) {
            console.warn('GEMINI_API_KEY is not defined in environment variables.');
        }
        this.genAI = new GoogleGenerativeAI(apiKey);
    }

    private readonly MODELS_TO_TRY = ['gemini-2.0-flash', 'gemini-flash-latest', 'gemini-2.5-flash'];

    public async classifyImage(imageBase64: string): Promise<ImageClassificationResult> {
        let lastError: any = null;

        for (const modelName of this.MODELS_TO_TRY) {
            try {
                const model = this.genAI.getGenerativeModel({ model: modelName });
                
                const base64Data = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
                let mimeType = 'image/jpeg';
                if (imageBase64.startsWith('data:')) {
                    const match = imageBase64.match(/^data:([^;]+);base64,/);
                    if (match) mimeType = match[1];
                }

                console.log(`Gemini SDK Request: Model=${modelName}, MimeType=${mimeType}`);

                const prompt = "Classify this clothing item into a primary category: Outerwear, Tops, Bottoms, Shoes, or Accessories. Also, provide a brief, descriptive name for the item (e.g., 'Black Denim Jacket' or 'White Silk Blouse'). Provide a confidence level between 0 and 1. Return ONLY valid JSON in the format: {\"category\": \"string\", \"name\": \"string\", \"confidence\": 0.0}";
                const imagePart = { inlineData: { data: base64Data, mimeType } };

                const result = await model.generateContent([prompt, imagePart]);
                const responseText = result.response.text();
                
                console.log(`Gemini SDK Response (${modelName}):`, responseText);

                const jsonMatch = responseText.match(/\{[\s\S]*\}/);
                if (!jsonMatch) throw new Error("Failed to parse JSON from AI response.");
                const parsed = JSON.parse(jsonMatch[0]);

                return {
                    category: parsed.category || "Unknown",
                    name: parsed.name || "Clothing Item",
                    confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0,
                };
            } catch (error: any) {
                console.error(`Gemini Error with ${modelName}:`, error.message);
                lastError = error;
                if (error.message.includes('404')) continue; // Try next model if 404
                if (error.message.includes('429')) continue; // Try next model if 429
                break; // Stop for other errors
            }
        }
        
        throw new Error(`Gemini API failed after trying all models. Last error: ${lastError?.message}`);
    }

    public async analyzeInspirationImage(imageBase64: string | null, dressCode: string, closetMetadata: string): Promise<any> {
        // Build Cache Key
        const hashInput = `${imageBase64 || 'no_image'}_${dressCode}_${closetMetadata}`;
        const cacheKey = crypto.createHash('md5').update(hashInput).digest('hex');
        
        if (GeminiService.cache.has(cacheKey)) {
            console.log(`[GeminiService] Returning CACHED response for key: ${cacheKey}`);
            return GeminiService.cache.get(cacheKey);
        }

        let lastError: any = null;

        for (const modelName of this.MODELS_TO_TRY) {
            try {
                const model = this.genAI.getGenerativeModel({ model: modelName });
                const prompt = `You are an elite professional fashion stylist with deep expertise in color theory and style coherence.

TASK: Generate outfit combinations for a "${dressCode}" aesthetic using the user's closet. ${imageBase64 ? "Analyze the inspiration photo provided and try to mimic its style." : "Rely entirely on your stylistic expertise for the requested dress code. MUST be exactly 1 perfect outfit."}

USER'S CLOSET ITEMS (JSON):
${closetMetadata}

=== STRICT RULES — FOLLOW EXACTLY ===

${imageBase64 ? `
RULE 1 — QUANTITY & QUALITY:
Generate between 1 and 3 outfits. NEVER force 3 outfits. Only include an outfit if it genuinely works stylistically.

RULE 2 — MISSING ITEMS:
If a crucial piece is missing to match the photo or style, you may set matchedClosetItemId to null and write a specific missingItemQuery (e.g., "black leather biker jacket").
` : `
RULE 1 — STRICT 1 OUTFIT & 100% CLOSET SOURCED:
You MUST generate EXACTLY ONE (1) outfit. DO NOT generate 2 or 3 outfits.
NO MISSING ITEMS ALLOWED. Every single category must use an existing item from the user's closet. matchedClosetItemId CANNOT be null. If you cannot find a perfect item, use the closest match available.

RULE 2 — STRICT CONCEPT ADHERENCE:
The outfit must perfectly match the "${dressCode}" concept. For example, if the concept is "Casual", DO NOT include any formal wear like dress pants or oxfords.
`}

RULE 3 — COLOR COHERENCE (CRITICAL):
Before assigning a closet item to an outfit slot, verify that its color is compatible with the overall look. 
- ALLOWED: navy blue jeans and dark blue jeans are similar enough tones.
- NOT ALLOWED: purple jeans when the look calls for neutral/dark denim.

RULE 4 — SELF-CONSISTENCY CHECK:
Before outputting each outfit, mentally verify: "Does this complete look actually work as a ${dressCode} outfit?" If the answer is no or uncertain, drop it.

OUTPUT FORMAT — Return ONLY valid JSON, no markdown, no explanation:
{
  "outfits": [
    [
      {
        "category": "CategoryName",
        "matchedClosetItemId": "item_id_string_or_null",
        "missingItemQuery": ${imageBase64 ? `"specific_search_query_or_null"` : `null`}
      }
    ]
  ]
}
The "outfits" array contains ${imageBase64 ? "1 to 3 arrays (one per outfit)" : "EXACTLY 1 array (the single outfit)"}. Each inner array has one object per clothing category needed for that look.`;

                const contentParts: any[] = [prompt];
                if (imageBase64) {
                    const base64Data = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
                    contentParts.push({ inlineData: { data: base64Data, mimeType: 'image/jpeg' } });
                }

                const result = await model.generateContent(contentParts);
                const text = result.response.text();
                
                const jsonMatch = text.match(/\{[\s\S]*\}/);
                if (!jsonMatch) throw new Error("Failed to parse JSON from AI response.");
                
                const parsedData = JSON.parse(jsonMatch[0]);
                
                // Save to Cache
                GeminiService.cache.set(cacheKey, parsedData);
                console.log(`[GeminiService] CACHED new response with key: ${cacheKey}`);
                
                return parsedData;
            } catch (error: any) {
                console.error(`Gemini Error with ${modelName}:`, error.message);
                lastError = error;
                if (error.message.includes('404') || error.message.includes('429')) continue;
                break;
            }
        }
        
        throw new Error(`Gemini API failed after trying all models. Last error: ${lastError?.message}`);
    }
}
