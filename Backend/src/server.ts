import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors';
import path from 'path';
import { uploadClothingItem } from './controllers/itemController';
import { getRecommendations } from './controllers/productController';
import { analyzeInspiration } from './controllers/stylistController';

const app = express();
const port = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// REQUEST LOGGER
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.path}`);
    next();
});

// API Rotaları
app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));
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