import { Request, Response } from 'express';
import { ProductRecommendation } from '../factories/CommerceFactory';
import { GoogleCommerceFactory } from '../services/CommerceService';

const commerceFactory = new GoogleCommerceFactory();
const commerceProvider = commerceFactory.createProvider();

// Structure for our in-memory cache
interface CacheEntry {
    timestamp: number;
    products: ProductRecommendation[];
}

// In-memory cache acting as 'product_cache' DB table temporarily
const product_cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

export const getRecommendations = async (req: Request, res: Response): Promise<void> => {
    try {
        const { searchQuery } = req.body;

        if (!searchQuery) {
             res.status(400).json({ error: '"searchQuery" is required in the request body.' });
             return;
        }

        // Create a unique key for this robust visual query combination
        const cacheKey = searchQuery.toLowerCase().trim();
        const now = Date.now();

        // 1. Check the in-memory cache first
        if (product_cache.has(cacheKey)) {
            const entry = product_cache.get(cacheKey)!;
            const age = now - entry.timestamp;

            if (age < CACHE_TTL_MS) {
                // Cache hit within 24 hours -> return cached data
                 res.status(200).json({
                    source: 'cache',
                    recommendations: entry.products
                });
                return;
            } else {
                // Cache expired, remove it to avoid memory bloat
                product_cache.delete(cacheKey);
            }
        }

        // 2. Cache miss (or expired) -> call CommerceService
        const recommendations = await commerceProvider.findProducts(searchQuery);

        // 3. Save fresh result to cache
        product_cache.set(cacheKey, {
            timestamp: now,
            products: recommendations
        });

        // 4. Return the new recommendations
         res.status(200).json({
            source: 'api',
            recommendations: recommendations
        });
        return;

    } catch (error: any) {
        console.error('[Controller] Error in getRecommendations:', error.message || error);
        
        if (error.message.includes('429')) {
             console.warn('[Controller] Quota hit (429). Informing frontend.');
             res.status(429).json({ error: 'Google Search API quota exceeded.' });
             return;
        }

         res.status(500).json({ error: 'An error occurred while fetching product recommendations.' });
         return;
    }
};
