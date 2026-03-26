export interface ProductRecommendation {
    title: string;
    image_url: string;
    purchase_url: string;
    price: string;
    source: string;
}

export class CommerceService {
    private apiKey: string;
    private searchEngineId: string;

    constructor() {
        this.apiKey = process.env.GOOGLE_SEARCH_API_KEY || '';
        this.searchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID || '';

        if (!this.apiKey || !this.searchEngineId) {
            console.warn('Google Search API Key (GOOGLE_SEARCH_API_KEY) or Engine ID (GOOGLE_SEARCH_ENGINE_ID) is missing in environment variables.');
        }
    }

    public async findProducts(searchQuery: string): Promise<ProductRecommendation[]> {
        const query = encodeURIComponent(`${searchQuery} buy clothing`);
        // Using standard native fetch (available in Node 18+)
        const url = `https://www.googleapis.com/customsearch/v1?key=${this.apiKey}&cx=${this.searchEngineId}&q=${query}&searchType=image`;

        try {
            const response = await fetch(url);
            if (!response.ok) {
                const errorBody = await response.text();
                throw new Error(`Google Custom Search API error: ${response.status} - ${errorBody}`);
            }

            const data = await response.json();
            if (!data.items) {
                return [];
            }

            return data.items.map((item: any): ProductRecommendation => {
                // Price isn't deeply structured by default in Image Search unless you parse pagemap data.
                // Depending on the Custom Search settings, it could be available in item.pagemap.offer[0].price.
                const pagemap = item.pagemap || {};
                const offer = pagemap.offer && pagemap.offer.length > 0 ? pagemap.offer[0] : null;
                let priceValue = offer && offer.price ? `${offer.priceCurrency || '$'}${offer.price}` : 'Check Website';

                if (priceValue.includes('%') || priceValue.toLowerCase().includes('off')) {
                    priceValue = 'Check Website';
                }

                return {
                    title: item.title,
                    image_url: item.link, 
                    purchase_url: item.image?.contextLink || item.link, 
                    price: priceValue,
                    source: item.displayLink || new URL(item.image?.contextLink || item.link || 'http://unknown.com').hostname
                };
            });

        } catch (error) {
            console.error('API Error in CommerceService:', error instanceof Error ? error.message : error);
            throw new Error('Google Custom Search API Key is missing or rejected the request. Please provide valid keys in Backend/.env!');
        }
    }
}
