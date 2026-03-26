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
            if (!data.items || data.items.length === 0) {
                console.log('No products found for query:', searchQuery);
                return [];
            }

            const processedItems = data.items.map((item: any): ProductRecommendation | null => {
                try {
                    const pagemap = item.pagemap || {};
                    const offer = pagemap.offer && pagemap.offer.length > 0 ? pagemap.offer[0] : null;
                    let priceValue = offer && offer.price ? `${offer.priceCurrency || '$'}${offer.price}` : 'Check Website';

                    if (priceValue.includes('%') || priceValue.toLowerCase().includes('off')) {
                        priceValue = 'Check Website';
                    }

                    const purchaseUrl = item.image?.contextLink || item.link || '';
                    let source = item.displayLink;
                    if (!source && purchaseUrl) {
                        try { source = new URL(purchaseUrl).hostname; } catch(e) { source = 'External Store'; }
                    }

                    return {
                        title: item.title || 'Unknown Product',
                        image_url: item.link || '', 
                        purchase_url: purchaseUrl, 
                        price: priceValue,
                        source: source || 'External'
                    };
                } catch (mapError) {
                    console.error('Error processing individual product item:', mapError);
                    return null;
                }
            }).filter((item: any) => item !== null) as ProductRecommendation[];

            return processedItems;

        } catch (error) {
            console.error('API Error in CommerceService:', error instanceof Error ? error.message : error);
            // Don't throw a generic error that obscures the real issue
            throw error;
        }
    }
}
