import { Request, Response } from 'express';
import { GeminiService } from '../services/GeminiService';

const AI_STYLIST_SERVICE = new GeminiService();
const HTTP_BAD_REQUEST = 400;
const HTTP_OK = 200;
const HTTP_TOO_MANY_REQUESTS = 429;
const HTTP_INTERNAL_SERVER_ERROR = 500;
const DEFAULT_DRESS_CODE = 'Avant-Garde';

export const analyzeInspiration = async (request: Request, response: Response): Promise<void> => {
    try {
        if (!hasValidStylingRequest(request)) {
             response.status(HTTP_BAD_REQUEST).json({ error: 'Either imageBase64 or dressCode must be provided.' });
             return;
        }

        const stylingResult = await generateOutfitRecommendation(request);
        
        response.status(HTTP_OK).json(stylingResult);
    } catch (error: any) {
        handleStylingError(error, response);
    }
};

function hasValidStylingRequest(request: Request): boolean {
    const { imageBase64, dressCode } = request.body;
    return Boolean(imageBase64 || dressCode);
}

async function generateOutfitRecommendation(request: Request) {
    const { imageBase64, dressCode, closet } = request.body;
    const closetMetadataJson = closet ? JSON.stringify(closet) : "[]";
    const targetDressCode = dressCode || DEFAULT_DRESS_CODE;

    return await AI_STYLIST_SERVICE.analyzeInspirationImage(imageBase64, targetDressCode, closetMetadataJson);
}

function handleStylingError(error: any, response: Response): void {
    console.error('Error in analyzeInspiration:', error.message || error);
    
    if (error.message?.includes(HTTP_TOO_MANY_REQUESTS.toString())) {
         response.status(HTTP_TOO_MANY_REQUESTS).json({ error: error.message });
         return;
    }
    
    response.status(HTTP_INTERNAL_SERVER_ERROR).json({ error: 'An error occurred while analyzing the inspiration image.' });
}
