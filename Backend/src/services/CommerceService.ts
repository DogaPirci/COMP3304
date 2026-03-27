import { CommerceProvider, ProductRecommendation, CommerceFactory } from '../factories/CommerceFactory';

const fetch = require('node-fetch');

export class CommerceService implements CommerceProvider {
    private apiKey: string;

    constructor() {
        this.apiKey = process.env.SERPAPI_KEY || '';

        if (!this.apiKey) {
            console.warn('[CommerceService] SERPAPI_KEY is missing.');
        }
    }

    public async findProducts(searchQuery: string): Promise<ProductRecommendation[]> {
        console.log(`[CommerceService] Searching for matching retail items: "${searchQuery}"`);
        console.log('🔑 SerpApi Key:', this.apiKey ? this.apiKey.substring(0, 15) + '...' : 'MISSING!!!');

        const brands = [
            'bershka.com', 'zara.com', 'hm.com', 'mango.com',
            'pullandbear.com', 'stradivarius.com', 'asos.com',
            'farfetch.com', 'net-a-porter.com', 'mytheresa.com'
        ];
        const siteFilter = brands.map(site => `site:${site}`).join(' OR ');
        const fullQuery = `${searchQuery} (${siteFilter})`;

        const url = `https://serpapi.com/search.json?engine=google_images&q=${encodeURIComponent(fullQuery)}&api_key=${this.apiKey}&num=10`;

        try {
            console.log(`[CommerceService] Requesting SerpApi for: ${searchQuery}`);
            let response = await fetch(url);
            let data: any = await response.json();

            if (data.error) {
                console.error('🚨 SERPAPI ERROR:', data.error);
                throw new Error(`SerpApi error: ${data.error}`);
            }

            // Fallback: broader search if no results
            if (!data.images_results || data.images_results.length === 0) {
                console.log('[CommerceService] No results with brand filters. Trying broader search...');
                const broadUrl = `https://serpapi.com/search.json?engine=google_images&q=${encodeURIComponent(searchQuery + ' fashion buy online')}&api_key=${this.apiKey}&num=10`;
                response = await fetch(broadUrl);
                data = await response.json();
            }

            if (!data.images_results || !Array.isArray(data.images_results)) {
                console.log('[CommerceService] No items found in SerpApi response.');
                return [];
            }

            return data.images_results.map((item: any): ProductRecommendation | null => {
                try {
                    if (!item.original) return null;

                    const sourceUrl = item.link || item.source || '';
                    let source = '';
                    try {
                        source = new URL(sourceUrl).hostname.replace('www.', '');
                    } catch {
                        source = 'Retailer';
                    }

                    const lowerSource = source.toLowerCase();
                    if (lowerSource.includes('bershka')) source = 'Bershka';
                    else if (lowerSource.includes('pullandbear')) source = 'Pull & Bear';
                    else if (lowerSource.includes('zara')) source = 'Zara';
                    else if (lowerSource.includes('hm.com') || lowerSource.includes('h&m')) source = 'H&M';
                    else if (lowerSource.includes('mango')) source = 'Mango';
                    else if (lowerSource.includes('asos')) source = 'ASOS';
                    else if (lowerSource.includes('farfetch')) source = 'Farfetch';

                    return {
                        title: item.title || 'Fashion Item',
                        image_url: item.original || item.thumbnail || '',
                        purchase_url: sourceUrl,
                        price: 'Check Store',
                        source: source || 'Retailer'
                    };
                } catch (err) {
                    return null;
                }
            }).filter((item: any) => item !== null && item.image_url) as ProductRecommendation[];

        } catch (error: any) {
            console.error('[CommerceService] Unexpected error:', error.message);
            return [];
        }
    }
}

/**
 * Concrete Creator for Google Commerce.
 */
export class GoogleCommerceFactory extends CommerceFactory {
    public createProvider(): CommerceProvider {
        return new CommerceService();
    }
}