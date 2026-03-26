import { Request, Response } from 'express';
import { GeminiService } from '../services/GeminiService';
import { DigitalClosetFactory } from '../factories/DigitalClosetFactory';

const geminiService = new GeminiService();
const digitalClosetFactory = new DigitalClosetFactory();

export const uploadClothingItem = async (req: Request, res: Response): Promise<void> => {
    try {
        const { imageBase64 } = req.body;
        
        if (!imageBase64) {
             res.status(400).json({ error: 'imageBase64 is required in the request body.' });
             return;
        }

        // 1. Call GeminiService to classify the base64 image
        const classificationResult = await geminiService.classifyImage(imageBase64);
        
        // 2. Pass the classification data to the Factory
        const clothingItem = digitalClosetFactory.createClothing(
            classificationResult.category,
            classificationResult.confidence
        );

        // 3. If Factory returned Unknown (due to confidence < 0.60 or unknown category string)
        if (clothingItem.get_category() === 'Unknown') {
             res.status(200).json({
                message: 'Item could not be confidently identified. Please provide a manual category correction.',
                classification: classificationResult, // Send the original low-confidence prediction
                item_data: {
                    category: clothingItem.get_category(),
                    info: clothingItem.display_info()
                },
                needsManualCorrection: true
            });
            return;
        }

        // 4. Succesfully classified and confidently parsed by factory
         res.status(201).json({
            message: 'Clothing item classified and created successfully.',
            item_data: {
                category: clothingItem.get_category(),
                info: clothingItem.display_info(),
                confidence: classificationResult.confidence
            }
        });
        return;

    } catch (error) {
        console.error('Error in uploadClothingItem:', error);
         res.status(500).json({ error: 'An internal server error occurred while processing the clothing item.' });
         return;
    }
};
