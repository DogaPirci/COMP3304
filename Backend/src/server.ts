import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { uploadClothingItem } from './controllers/itemController';
import { getRecommendations } from './controllers/productController';
import { analyzeInspiration } from './controllers/stylistController';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Frontend'den gelen istekleri ve büyük base64 resim dosyalarını kabul etmek için
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// API Rotaları
app.post('/api/items', uploadClothingItem);
app.post('/api/products', getRecommendations);
app.post('/api/inspiration', analyzeInspiration);

// Serve Frontend Static Files in Production
// Dockerfile copies the frontend build into the 'public' folder
app.use(express.static(path.join(__dirname, '../public')));

// Fallback to index.html for React/Next.js SPA routing using Express 5.x compatible syntax
app.use((req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'index.html'));
});

app.listen(port, () => {
    console.log(`Sunucu http://localhost:${port} adresinde çalışıyor`);
});