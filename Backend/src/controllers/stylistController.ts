import { Request, Response } from 'express';
import { GeminiService } from '../services/GeminiService';

const geminiService = new GeminiService();

export const analyzeInspiration = async (req: Request, res: Response): Promise<void> => {
    try {
        const { imageBase64, dressCode, closet } = req.body;
        
        if (!imageBase64 && !dressCode) {
             res.status(400).json({ error: 'Either imageBase64 or dressCode must be provided.' });
             return;
        }

        const closetMetadata = closet ? JSON.stringify(closet) : "[]";
        const result = await geminiService.analyzeInspirationImage(imageBase64, dressCode || 'Avant-Garde', closetMetadata);
        
         res.status(200).json(result);
         return;
    } catch (error: any) {
        console.error('Error in analyzeInspiration:', error.message || error);
        if (error.message.includes('429')) {
             res.status(429).json({ error: error.message });
             return;
        }
        res.status(500).json({ error: 'An error occurred while analyzing the inspiration image.' });
        return;
    }
};
