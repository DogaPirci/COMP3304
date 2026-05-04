# VogueVault: AI-Powered Digital Twin & Fashion Stylist 👗🤖

VogueVault is an elite, AI-driven personal wardrobe management system and digital stylist. Built with modern web technologies, it allows users to digitize their physical closet and uses Google's Gemini AI to act as a professional fashion stylist.

The AI stylist analyzes user uploads, categorizes them using Computer Vision, and generates highly curated outfits based on strict fashion rules including Silhouette & Form, Texture Matching, and Color Theory.

## 🌟 Key Features

1. **Digital Twin (My Closet):** Upload images of your clothing. Gemini AI automatically classifies items into categories (Outerwear, Tops, Bottoms, Shoes, Accessories) and assigns confidence scores. You can manually adjust categories if desired.
2. **Professional AI Stylist:** A strictly-prompted, professional AI stylist that:
   - Prioritizes silhouette/form matching over color.
   - Respects texture and material vibes (e.g., matching leather with appropriate textures).
   - Uses Color Theory (analogous and complementary colors) when exact color matches are missing.
   - Refuses to suggest mismatched styles from your closet and instead suggests missing pieces via **Smart Commerce**.
3. **Global Spotlight Search:** Instantly search across your closet, saved ensembles, and e-commerce partners via a unified, animated header dropdown.
4. **Saved Ensembles:** Archive your favorite AI-generated outfits or inspiration-matched creations with dedicated styling notes.
5. **Smart Commerce Integration:** Uses SerpApi to instantly find real-world purchase links (Zara, H&M, Mango, ASOS, Farfetch) for items missing from your digital closet to complete a look.

## 🏗️ Architecture & Technology Stack

The project strictly follows **Clean Code** principles, featuring guard clauses, constant variable encapsulation, and single responsibility across all backend services. 

### Frontend
- **React 18** + **TypeScript**
- **Vite** (Build Tool)
- **Framer Motion** (High-fidelity UI animations & Modals)
- **Tailwind CSS** (Utility-first styling, Dark mode primary)
- **Lucide React** (Iconography)

### Backend
- **Node.js** + **Express.js** + **TypeScript**
- **Supabase** (PostgreSQL Database, Auth, Storage)
- **Google Generative AI SDK (Gemini)** (Image classification & Stylist prompt engineering)
- **SerpApi** (Retailer image & link scraping)
- **Docker Compose** (Containerized Development & Deployment)

## 🧠 AI Prompt Engineering

The core value of VogueVault is its AI decision engine (`GeminiService.ts`). The model is prompted to act as an *Elite Fashion Stylist*. 
- **>=80% Match:** The AI uses your closet item and explains its reasoning.
- **50-80% Match:** The AI adapts the color palette to make it work.
- **<50% Match:** The AI *will not* force a bad outfit. It leaves the item empty and provides a `missingItemQuery` so the Commerce Engine can find the exact missing piece online.

## 🚀 Getting Started

### Prerequisites
- Docker & Docker Compose
- Supabase Project (Database, Auth, Storage buckets: `closet_images`)
- Google Gemini API Key
- SerpApi Key

### Installation

1. Clone the repository.
2. Configure environment variables in a `.env` file in both `Frontend` and `Backend` directories.
   
**Backend (`Backend/.env`)**
```env
PORT=3000
GEMINI_API_KEY=your_gemini_key
SERPAPI_KEY=your_serpapi_key
```

**Frontend (`Frontend/.env`)**
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

3. Run with Docker Compose:
```bash
docker compose up --build
```
4. Access the web app at `http://localhost:5173`.

## 📜 Database Schema Requirements
Execute the following SQL in your Supabase SQL Editor:

```sql
-- Closet Items
CREATE TABLE closet_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  name TEXT,
  category TEXT,
  image TEXT,
  confidence TEXT,
  manually_changed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Saved Outfits
CREATE TABLE saved_outfits (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  dress_code TEXT,
  outfit_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Profiles
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  full_name TEXT,
  preferred_style TEXT,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  favorite_brands TEXT[] DEFAULT '{}',
  discovery_source TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 🤝 Contributing
Built according to Clean Code standards. When contributing, please ensure:
- Functions follow the Single Responsibility Principle.
- Avoid deep nesting (use Guard Clauses).
- Keep boolean variables phrased as questions (e.g., `hasValidStylingRequest`).
- No magic numbers. Use named constants.

---
*Elevate your wardrobe digitally with VogueVault.*
