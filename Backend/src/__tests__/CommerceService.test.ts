import { CommerceService } from '../services/CommerceService';

// Mock node-fetch
jest.mock('node-fetch');
const fetch = require('node-fetch');

describe('CommerceService', () => {
    let service: CommerceService;

    beforeEach(() => {
        // Reset all mocks
        jest.resetAllMocks();
        process.env.SERPAPI_KEY = 'test-key';
        service = new CommerceService();
    });

    afterEach(() => {
        delete process.env.SERPAPI_KEY;
    });

    it('should fetch and return valid product recommendations', async () => {
        const mockResponse = {
            images_results: [
                {
                    title: 'Zara Black Dress',
                    original: 'https://zara.com/image.jpg',
                    link: 'https://zara.com/dress'
                }
            ]
        };

        fetch.mockResolvedValueOnce({
            json: jest.fn().mockResolvedValueOnce(mockResponse)
        });

        const results = await service.findProducts('black dress', ['zara']);

        expect(results).toHaveLength(1);
        expect(results[0].source).toBe('Zara');
        expect(results[0].purchase_url).toBe('https://zara.com/dress');
        expect(fetch).toHaveBeenCalledTimes(1);
    });

    it('should fallback to secondary search if first fails', async () => {
        fetch
            .mockResolvedValueOnce({
                json: jest.fn().mockResolvedValueOnce({ images_results: [] })
            })
            .mockResolvedValueOnce({
                json: jest.fn().mockResolvedValueOnce({
                    images_results: [
                        {
                            title: 'H&M Shirt',
                            original: 'https://hm.com/img.jpg',
                            link: 'https://hm.com/shirt'
                        }
                    ]
                })
            });

        const results = await service.findProducts('white shirt');

        expect(results).toHaveLength(1);
        expect(results[0].source).toBe('H&M');
        expect(fetch).toHaveBeenCalledTimes(2);
    });

    it('should handle API errors gracefully and return empty array', async () => {
        fetch.mockResolvedValueOnce({
            json: jest.fn().mockResolvedValueOnce({ error: 'Invalid API key' })
        });

        const results = await service.findProducts('shoes');
        expect(results).toEqual([]);
    });

    it('should handle fetch throwing error', async () => {
        fetch.mockRejectedValueOnce(new Error('Network error'));
        
        const results = await service.findProducts('shoes');
        expect(results).toEqual([]);
    });
});
