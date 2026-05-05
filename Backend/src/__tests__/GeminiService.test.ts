import { GeminiService } from '../services/GeminiService';

// Mock the Google Generative AI SDK
jest.mock('@google/generative-ai', () => {
    return {
        GoogleGenerativeAI: jest.fn().mockImplementation(() => {
            return {
                getGenerativeModel: jest.fn().mockReturnValue({
                    generateContent: jest.fn().mockResolvedValue({
                        response: {
                            text: () => JSON.stringify({
                                outfits: [[{ component_type: 'Shirt', color_palette: 'White' }]]
                            })
                        }
                    })
                })
            };
        })
    };
});

describe('GeminiService', () => {
    let service: GeminiService;

    beforeEach(() => {
        process.env.GEMINI_API_KEY = 'test-key';
        service = new GeminiService();
    });

    afterEach(() => {
        delete process.env.GEMINI_API_KEY;
    });

    it('should extract JSON from markdown successfully', () => {
        const markdown = '```json\n{"test": true}\n```';
        const result = (service as any).extractJsonFromText(markdown);
        expect(result).toBe('{"test": true}');
    });

    it('should execute classification via GoogleGenerativeAI', async () => {
        const response = await service.classifyImage('test base64');
        expect(response).toBeDefined();
    });

    it('should execute analyzeInspirationImage', async () => {
        const response = await service.analyzeInspirationImage('test base64', 'Formal', '[]');
        expect(response).toBeDefined();
    });
});
