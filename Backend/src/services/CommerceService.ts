import { CommerceProvider, ProductRecommendation, CommerceFactory } from '../factories/CommerceFactory';

const fetch = require('node-fetch');

const SERP_API_BASE_URL = 'https://serpapi.com/search.json';
const ENGINE_TYPE = 'google_images';
const MAX_RESULTS_COUNT = 10;
const FALLBACK_SEARCH_SUFFIX = ' fashion buy online';

const RETAILER_DOMAIN_MAP: Record<string, string> = {
    'bershka': 'Bershka',
    'pullandbear': 'Pull & Bear',
    'zara': 'Zara',
    'hm.com': 'H&M',
    'h&m': 'H&M',
    'mango': 'Mango',
    'asos': 'ASOS',
    'farfetch': 'Farfetch'
};

const PREFERRED_BRANDS = [
    'bershka.com', 'zara.com', 'hm.com', 'mango.com',
    'pullandbear.com', 'stradivarius.com', 'asos.com',
    'farfetch.com', 'net-a-porter.com', 'mytheresa.com'
];

export class CommerceService implements CommerceProvider {
    private readonly apiKey: string;

    constructor() {
        this.apiKey = process.env.SERPAPI_KEY || '';
        this.validateApiKey();
    }

    private validateApiKey(): void {
        if (!this.apiKey) {
            console.warn('[CommerceService] SERPAPI_KEY is missing.');
        }
    }

    public async findProducts(searchQuery: string, preferredBrands?: string[]): Promise<ProductRecommendation[]> {
        try {
            const rawResults = await this.executeSearch(searchQuery, preferredBrands);
            return this.parseAndFilterResults(rawResults);
        } catch (error: any) {
            console.error('[CommerceService] Unexpected error:', error.message);
            return [];
        }
    }

    private async executeSearch(searchQuery: string, preferredBrands?: string[]): Promise<any[]> {
        const brandFilteredQuery = this.buildBrandFilteredQuery(searchQuery, preferredBrands);
        const filteredResponse = await this.fetchFromSerpApi(brandFilteredQuery);

        if (this.hasValidResults(filteredResponse)) {
            return filteredResponse.images_results;
        }

        const fallbackQuery = `${searchQuery}${FALLBACK_SEARCH_SUFFIX}`;
        const fallbackResponse = await this.fetchFromSerpApi(fallbackQuery);

        return this.hasValidResults(fallbackResponse) ? fallbackResponse.images_results : [];
    }

    private buildBrandFilteredQuery(baseQuery: string, preferredBrands?: string[]): string {
        const brandsToUse = preferredBrands && preferredBrands.length > 0 ? preferredBrands : PREFERRED_BRANDS;
        
        // e.g. 'Bershka' -> 'bershka.com'
        const normalizedBrands = brandsToUse.map(brand => {
            let lowerBrand = brand.toLowerCase();
            if (!lowerBrand.includes('.com') && !lowerBrand.includes('.net')) {
                // If it's H&M, handle specifically
                if (lowerBrand === 'h&m' || lowerBrand === 'hm') return 'hm.com';
                // Remove spaces for things like Pull & Bear
                lowerBrand = lowerBrand.replace(/\s+/g, '');
                return `${lowerBrand}.com`;
            }
            return lowerBrand;
        });

        const siteFilter = normalizedBrands.map(site => `site:${site}`).join(' OR ');
        return `${baseQuery} (${siteFilter})`;
    }

    private async fetchFromSerpApi(query: string): Promise<any> {
        const url = `${SERP_API_BASE_URL}?engine=${ENGINE_TYPE}&q=${encodeURIComponent(query)}&api_key=${this.apiKey}&num=${MAX_RESULTS_COUNT}`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.error) {
            throw new Error(`SerpApi error: ${data.error}`);
        }

        return data;
    }

    private hasValidResults(responseData: any): boolean {
        return Boolean(responseData?.images_results && Array.isArray(responseData.images_results) && responseData.images_results.length > 0);
    }

    private parseAndFilterResults(rawResults: any[]): ProductRecommendation[] {
        return rawResults
            .map((item) => this.mapToProductRecommendation(item))
            .filter(this.isValidProductRecommendation) as ProductRecommendation[];
    }

    private mapToProductRecommendation(rawItem: any): ProductRecommendation | null {
        try {
            if (!rawItem.original) return null;

            const sourceUrl = rawItem.link || rawItem.source || '';
            const retailerName = this.extractRetailerName(sourceUrl);

            return {
                title: rawItem.title || 'Fashion Item',
                image_url: rawItem.original || rawItem.thumbnail || '',
                purchase_url: sourceUrl,
                price: 'Check Store',
                source: retailerName
            };
        } catch {
            return null;
        }
    }

    private extractRetailerName(sourceUrl: string): string {
        let domain = '';
        try {
            domain = new URL(sourceUrl).hostname.replace('www.', '');
        } catch {
            domain = 'Retailer';
        }

        const lowerDomain = domain.toLowerCase();
        
        for (const [key, brandName] of Object.entries(RETAILER_DOMAIN_MAP)) {
            if (lowerDomain.includes(key)) {
                return brandName;
            }
        }

        return domain || 'Retailer';
    }

    private isValidProductRecommendation(product: ProductRecommendation | null): product is ProductRecommendation {
        return product !== null && Boolean(product.image_url);
    }
}

export class GoogleCommerceFactory extends CommerceFactory {
    public createProvider(): CommerceProvider {
        return new CommerceService();
    }
}