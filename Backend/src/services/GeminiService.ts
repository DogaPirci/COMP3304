import { GoogleGenerativeAI } from '@google/generative-ai';

export interface ImageClassificationResult {
    category: string;
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

    public async classifyImage(imageBase64: string): Promise<ImageClassificationResult> {
        try {
            // Initialize the specifically requested model
            const model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });
            
            const prompt = `Classify this clothing item into a primary category. Provide a confidence level between 0 and 1. Return ONLY valid JSON in the format: {"category": "string", "confidence": 0.0}`;

            // Handle base64 string safely if it contains data URI prefix
            const base64Data = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;

            const imagePart = {
                inlineData: {
                    data: base64Data,
                    mimeType: 'image/jpeg' // Generic fallback, depends on frontend implementation
                }
            };

            const result = await model.generateContent([prompt, imagePart]);
            const responseText = result.response.text();
            
            // Extract the JSON block specifically to avoid markdown formatting issues
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error("Failed to parse JSON from generative AI response.");
            }
            
            const parsed = JSON.parse(jsonMatch[0]);

            return {
                category: parsed.category || "Unknown",
                confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0,
            };
        } catch (error) {
            console.error('Error in GeminiService.classifyImage:', error);
            throw error;
        }
    }

    public async analyzeInspirationImage(imageBase64: string, dressCode: string, closetMetadata: string): Promise<any> {
        try {
            const model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });
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
        } catch (error) {
            console.error('Error in GeminiService.analyzeInspirationImage:', error);
            throw error;
        }
    }
}
