import { GoogleGenerativeAI } from '@google/generative-ai';
import crypto from 'crypto';

export interface ImageClassificationResult {
    category: string;
    name: string;
    confidence: number;
}

export interface OutfitRecommendation {
    category: string;
    matchedClosetItemId: string | null;
    missingItemQuery: string | null;
    reason?: string;
    recommendation?: string;
}

export interface OutfitCombination {
    outfits: OutfitRecommendation[][];
}

const HTTP_STATUS_NOT_FOUND = '404';
const HTTP_STATUS_TOO_MANY_REQUESTS = '429';
const DEFAULT_MIME_TYPE = 'image/jpeg';
const JSON_REGEX = /\{[\s\S]*\}/;

export class GeminiService {
    private readonly generativeAIClient: GoogleGenerativeAI;
    private static readonly responseCache: Map<string, unknown> = new Map();
    private readonly fallbackModels = ['gemini-2.0-flash', 'gemini-flash-latest', 'gemini-2.5-flash'];

    constructor() {
        const apiKey = process.env.GEMINI_API_KEY || '';
        this.validateApiKey(apiKey);
        this.generativeAIClient = new GoogleGenerativeAI(apiKey);
    }

    private validateApiKey(apiKey: string): void {
        if (!apiKey) {
            console.warn('GEMINI_API_KEY is missing from environment variables.');
        }
    }

    public async classifyImage(base64ImageString: string): Promise<ImageClassificationResult> {
        let lastEncounteredError: Error | null = null;

        for (const targetModel of this.fallbackModels) {
            try {
                return await this.attemptClassificationWithModel(targetModel, base64ImageString);
            } catch (error: any) {
                this.logModelError(targetModel, error);
                lastEncounteredError = error;
                if (this.isRetryableError(error)) continue;
                break;
            }
        }
        
        throw new Error(`Image classification failed across all models. Last error: ${lastEncounteredError?.message}`);
    }

    private async attemptClassificationWithModel(modelName: string, base64ImageString: string): Promise<ImageClassificationResult> {
        const aiModel = this.generativeAIClient.getGenerativeModel({ model: modelName });
        const imagePart = this.buildImagePart(base64ImageString);
        
        const classificationPrompt = "Classify this clothing item into a primary category: Outerwear, Tops, Bottoms, Shoes, or Accessories. Also, provide a brief, descriptive name for the item (e.g., 'Black Denim Jacket' or 'White Silk Blouse'). Provide a confidence level between 0 and 1. Return ONLY valid JSON in the format: {\"category\": \"string\", \"name\": \"string\", \"confidence\": 0.0}";
        
        const generatedResult = await aiModel.generateContent([classificationPrompt, imagePart]);
        return this.parseClassificationResponse(generatedResult.response.text());
    }

    private buildImagePart(base64ImageString: string): any {
        const rawBase64Data = base64ImageString.includes(',') ? base64ImageString.split(',')[1] : base64ImageString;
        const mimeType = this.extractMimeType(base64ImageString);
        return { inlineData: { data: rawBase64Data, mimeType } };
    }

    private extractMimeType(base64ImageString: string): string {
        if (!base64ImageString.startsWith('data:')) return DEFAULT_MIME_TYPE;
        const mimeTypeMatch = base64ImageString.match(/^data:([^;]+);base64,/);
        return mimeTypeMatch ? mimeTypeMatch[1] : DEFAULT_MIME_TYPE;
    }

    private parseClassificationResponse(responseText: string): ImageClassificationResult {
        const extractedJsonString = this.extractJsonFromText(responseText);
        const parsedData = JSON.parse(extractedJsonString);

        return {
            category: parsedData.category || "Unknown",
            name: parsedData.name || "Clothing Item",
            confidence: typeof parsedData.confidence === 'number' ? parsedData.confidence : 0,
        };
    }

    private extractJsonFromText(text: string): string {
        const jsonMatch = text.match(JSON_REGEX);
        if (!jsonMatch) throw new Error("Could not locate valid JSON structure in the response.");
        return jsonMatch[0];
    }

    private isRetryableError(error: Error): boolean {
        return error.message.includes(HTTP_STATUS_NOT_FOUND) || error.message.includes(HTTP_STATUS_TOO_MANY_REQUESTS);
    }

    private logModelError(modelName: string, error: Error): void {
        console.error(`Gemini Error [${modelName}]:`, error.message);
    }

    public async analyzeInspirationImage(base64ImageString: string | null, targetDressCode: string, userClosetDataJson: string): Promise<OutfitCombination> {
        const cacheIdentifier = this.generateCacheKey(base64ImageString, targetDressCode, userClosetDataJson);
        
        if (this.hasCachedResponse(cacheIdentifier)) {
            return this.getCachedResponse(cacheIdentifier) as OutfitCombination;
        }

        let lastEncounteredError: Error | null = null;

        for (const targetModel of this.fallbackModels) {
            try {
                const generatedOutfit = await this.attemptStylingWithModel(targetModel, base64ImageString, targetDressCode, userClosetDataJson);
                this.cacheResponse(cacheIdentifier, generatedOutfit);
                return generatedOutfit;
            } catch (error: any) {
                this.logModelError(targetModel, error);
                lastEncounteredError = error;
                if (this.isRetryableError(error)) continue;
                break;
            }
        }
        
        throw new Error(`Styling generation failed across all models. Last error: ${lastEncounteredError?.message}`);
    }

    private generateCacheKey(base64ImageString: string | null, dressCode: string, closetData: string): string {
        const uniqueString = `${base64ImageString || 'empty'}_${dressCode}_${closetData}`;
        return crypto.createHash('md5').update(uniqueString).digest('hex');
    }

    private hasCachedResponse(key: string): boolean {
        return GeminiService.responseCache.has(key);
    }

    private getCachedResponse(key: string): unknown {
        console.log(`[GeminiService] Retrieved cached output for key: ${key}`);
        return GeminiService.responseCache.get(key);
    }

    private cacheResponse(key: string, data: unknown): void {
        GeminiService.responseCache.set(key, data);
    }

    private async attemptStylingWithModel(modelName: string, base64ImageString: string | null, dressCode: string, closetData: string): Promise<OutfitCombination> {
        const aiModel = this.generativeAIClient.getGenerativeModel({ model: modelName });
        const requestPayload = this.buildStylingPayload(base64ImageString, dressCode, closetData);
        
        const generatedResult = await aiModel.generateContent(requestPayload);
        const extractedJsonString = this.extractJsonFromText(generatedResult.response.text());
        return JSON.parse(extractedJsonString) as OutfitCombination;
    }

    private buildStylingPayload(base64ImageString: string | null, dressCode: string, closetData: string): any[] {
        const stylistPrompt = this.createStylistPrompt(base64ImageString !== null, dressCode, closetData);
        const payloadParts: any[] = [stylistPrompt];

        if (base64ImageString) {
            payloadParts.push(this.buildImagePart(base64ImageString));
        }

        return payloadParts;
    }

    private createStylistPrompt(hasInspirationImage: boolean, dressCode: string, closetData: string): string {
        return `GÖREV: Sen profesyonel bir moda stilistisin. Kullanıcının gardırobundaki ürünler ile${hasInspirationImage ? ' ilham aldığı fotoğrafı (veya stili)' : ' istenen stili'} kıyaslayıp en iyi "${dressCode}" kombinini oluşturacaksın.

EŞLEŞTİRME KURALLARI (Öncelik Sırasına Göre):
1. Silüet ve Form Koruması: İlham fotoğrafındaki kıyafetin kesimi (Oversize, Slim-fit, Crop, Maxi vb.) neyse, gardıroptan ona en yakın kesimi seç. Kesim, renkten daha önemlidir.
2. Doku ve Materyal Uyumu: Deri bir parçanın yarattığı "sert/asi" havayı bez bir çanta ile bozma. Eğer deri yoksa, dokusu ağır duran (süet vb.) bir alternatif ara.
3. Renk Teorisi (Esneklik Buradadır): Eğer gardıropta ilham fotoğrafındaki rengin aynısı yoksa; Analog renkleri (komşu renkler) veya Tamamlayıcı renkleri (zıt ama uyumlu) kullan.
4. Vibe/Karakter Analizi: Bir parçanın karakteri kombinin ruhudur. Bunları düz/sade parçalarla değiştirme. Eğer gardıropta yoksa doğrudan e-ticaret linkine yönlendir.

KARAR MEKANİZMASI:
- %80 ve üzeri benzerlik: Gardıroptaki ürünü kullan. "Renk tonu biraz farklı ama stil aynı" diyerek açıkla.
- %50-%80 arası benzerlik: "Stil uyuyor ama renk paletini şu şekilde güncelledim" diyerek gardıroptan öner.
- %50 altı / Karakter uyuşmazlığı: Gardıropta benzer karakterde ürün yoksa (örneğin deri ceket yerine hırka vermen gerekiyorsa), bunu yapma! Doğrudan internetten (e-commerce) en yakın ürünü bulmak için \`matchedClosetItemId\` alanını \`null\` bırak ve \`missingItemQuery\` alanına eksik ürünü açıkla.

GARDIROP VERİSİ (JSON):
${closetData}

KATI KURALLAR:
${hasInspirationImage ? `
- En az 1, en fazla 3 kombin üret. Zorlama kombin yapma.` : `
- KESİNLİKLE SADECE 1 KOMBİN ÜRET.
- EKSİK PARÇA OLAMAZ (\`missingItemQuery\` null olmalı).
`}

ÇIKTI FORMATI - Yalnızca geçerli JSON döndür, markdown KULLANMA:
{
  "outfits": [
    [
      {
        "category": "Kategori Adı",
        "matchedClosetItemId": "Seçilen parçanın ID'si veya null",
        "missingItemQuery": "Eğer parça uyuşmuyorsa aranacak metin veya null",
        "reason": "Neden seçtiğini moda kuralıyla açıkla: örn. 'Kesimi birebir uyuyor'",
        "recommendation": "Tavsiye: örn. 'Pantolon açık renk olduğu için koyu kemerle dengele'"
      }
    ]
  ]
}`;
    }
}
