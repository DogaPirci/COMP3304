export interface ProductRecommendation {
    title: string;
    image_url: string;
    purchase_url: string;
    price: string;
    source: string;
}

/**
 * Interface for commerce providers to follow the Layered Architecture.
 */
export interface CommerceProvider {
    findProducts(searchQuery: string): Promise<ProductRecommendation[]>;
}

/**
 * Abstract Creator for the Factory Method pattern.
 */
export abstract class CommerceFactory {
    public abstract createProvider(): CommerceProvider;

    public async search(query: string): Promise<ProductRecommendation[]> {
        const provider = this.createProvider();
        return provider.findProducts(query);
    }
}
