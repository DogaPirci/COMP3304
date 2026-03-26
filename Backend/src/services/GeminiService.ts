import { GoogleGenerativeAI } from '@google/generative-ai';

export interface ImageClassificationResult {
    category: string;
    name: string;
    confidence: number;
}

export class GeminiService {
    private genAI: GoogleGenerativeAI;

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

    public async analyzeInspirationImage(imageBase64: string, dressCode: string, closetMetadata: string): Promise<any> {
        let lastError: any = null;

        for (const modelName of this.MODELS_TO_TRY) {
            try {
                const model = this.genAI.getGenerativeModel({ model: modelName });
                const prompt = `You are a professional fashion stylist. Analyze the inspiration photo for a ${dressCode} outfit.
The user has the following clothing items in their digital closet:
${closetMetadata}

Required:
Construct up to 3 outfit variations mimicking the photo's style. For each outfit, list the required categories.
For each category, check if the user has an item in their closet that is a strong visual/stylistic match (score >= 0.6).
If they do, return that item's "id" in "matchedClosetItemId" and set "missingItemQuery" to null.
If they DO NOT have a good match (or score < 0.6), set "matchedClosetItemId" to null, and write a highly specific, descriptive search query in "missingItemQuery" (e.g., "vintage oversized black leather biker jacket") that will be sent directly to the Google Shopping Search API to purchase it.

Return ONLY a valid JSON object strictly matching this schema:
{
  "outfits": [
    [
      {
        "category": "CategoryName",
        "matchedClosetItemId": "item_id_string_or_null",
        "missingItemQuery": "search_query_string_or_null"
      }
    ]
  ]
}
Do NOT include markdown block ticks. Your response must be purely parseable JSON.`;

                const base64Data = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
                const imagePart = { inlineData: { data: base64Data, mimeType: 'image/jpeg' } };

                const result = await model.generateContent([prompt, imagePart]);
                const text = result.response.text();
                
                const jsonMatch = text.match(/\{[\s\S]*\}/);
                if (!jsonMatch) throw new Error("Failed to parse JSON from AI response.");
                
                return JSON.parse(jsonMatch[0]);
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
