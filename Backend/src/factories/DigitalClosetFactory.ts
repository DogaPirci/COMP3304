export abstract class ClothingItem {
    /**
     * Returns the specific category of the clothing item.
     */
    public abstract get_category(): string;

    /**
     * Displays general information about the clothing item.
     * Can be overridden by subclasses if specific information is needed.
     */
    public display_info(): string {
        return `This item is classified as: ${this.get_category()}`;
    }
}

export class Shirt extends ClothingItem {
    public get_category(): string {
        return 'Tops';
    }
}

export class Trouser extends ClothingItem {
    public get_category(): string {
        return 'Bottoms';
    }
}

export class Shoe extends ClothingItem {
    public get_category(): string {
        return 'Shoes';
    }
}

export class Dress extends ClothingItem {
    public get_category(): string {
        return 'Outerwear';
    }
}

export class Jacket extends ClothingItem {
    public get_category(): string {
        return 'Outerwear';
    }
}

export class Accessory extends ClothingItem {
    public get_category(): string {
        return 'Accessories';
    }
}

export class UnknownItem extends ClothingItem {
    public get_category(): string {
        return 'Unknown';
    }

    public display_info(): string {
        return 'This item could not be confidently identified or falls into an unknown category.';
    }
}

export class DigitalClosetFactory {
    private static readonly CONFIDENCE_THRESHOLD: number = 0.60;

    /**
     * Factory method to create a ClothingItem based on the classification and confidence score.
     * 
     * @param classification The predicted category string (e.g., from GeminiService).
     * @param confidence The confidence probability (0.0 to 1.0).
     * @returns A concrete instance of ClothingItem.
     */
    public createClothing(classification: string, confidence: number): ClothingItem {
        // Enforce the strict confidence threshold
        if (confidence < DigitalClosetFactory.CONFIDENCE_THRESHOLD) {
            return new UnknownItem();
        }

        const normalizedClassification = classification.trim().toLowerCase();

        // Map various possible string classifications to their concrete TS classes
        switch (normalizedClassification) {
            case 'tops':
            case 'top':
            case 'shirt':
            case 't-shirt':
            case 'tshirt':
            case 'blouse':
                return new Shirt();
            case 'bottoms':
            case 'trouser':
            case 'trousers':
            case 'pants':
            case 'jeans':
                return new Trouser();
            case 'shoes':
            case 'shoe':
            case 'sneaker':
            case 'sneakers':
            case 'boots':
                return new Shoe();
            case 'outerwear':
            case 'jacket':
            case 'coat':
            case 'hoodie':
            case 'sweater':
            case 'dress':
            case 'skirt':
                return new Dress();
            case 'accessories':
            case 'accessory':
            case 'watch':
            case 'belt':
            case 'bag':
            case 'glasses':
            case 'hat':
                return new Accessory();
            default:
                return new UnknownItem();
        }
    }
}
