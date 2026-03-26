#  VogueVault: AI-Powered Online Closet

**VogueVault** is an AI-powered digital wardrobe management system designed to bridge the gap between physical closets and digital convenience.

---

> [!TIP]
> **New to the project?** Read our [Simple System Explainer](SYSTEM_EXPLAINER.md) to understand how the Frontend, Backend, and AI work together in plain English!

---

##  1. Project Overview
VogueVault creates a personalised digital twin of a user's physical wardrobe. Leveraging the power of the **Google Gemini Vision API** (using zero-shot classification without the need for custom model training), the system automatically categorises uploaded clothing items, suggests outfits based on specific dress codes, and helps users make more sustainable fashion choices.

### The Core Problems We Solve:
* **Decision Fatigue:** Users struggle to translate abstract dress codes (e.g., “Smart Casual”) into concrete outfits using the items they already own.
* **Wardrobe Invisibility:** Physical wardrobes are often disorganised; items purchased months ago are easily forgotten, making it difficult for users to recall what they actually have.
* **Inefficient Shopping:** Users frequently purchase items they already own because they do not remember their existing wardrobe while shopping.

### Key Objectives:
* **Reduce Decision Fatigue:** Help users quickly translate dress codes into concrete outfits from their own collection.
* **Promote Sustainability:** Increase the utility of existing clothes to discourage unnecessary new purchases.
* **Smart Organization:** Automatically tag and sort items by category, colour, and style without manual data entry.
* **Visual Inspiration:** Allow users to upload "inspiration photos" and find the closest matching items within their own digital closet.

---

##  2. Key Features
* **Digital Closet Management:** Upload clothing photos and automatically categorise them using AI. Includes a manual correction feature if the AI's confidence score is low.
* **Intelligent Concept Stylist:** Receive multiple outfit recommendations based on specific events and dress codes using AI visual reasoning.
* **AI Visual Style Matcher:** Upload an inspiration photo to generate a style descriptor and find visually matching items from your own wardrobe.
* **Smart Commerce Integration:** Detect missing items in an outfit and get real product recommendations with direct purchase links.
* **Secure User Authentication:** Private and secure wardrobe data management using **Supabase Auth**.

---

##  3. System Architecture & Software Engineering
To ensure the application is robust and maintainable, VogueVault strictly adheres to modern software engineering principles:

* **Layered (N-Tier) Architecture:** The system is divided into Presentation, Business Logic, AI & External Services, and Data & Infrastructure layers for modularity and scalability.
* **Factory Method Design Pattern:** Applied in the Digital Closet Management module. When the Gemini Vision API classifies an image, a `DigitalClosetFactory` dynamically instantiates the correct object (e.g., Shirt, Trouser, Shoe), decoupling the API logic from concrete classes.

---

##  4. Technologies Used
| Category | Technology |
| :--- | :--- |
| **Frontend & API** | Next.js (React) and Tailwind CSS |
| **Database & Auth** | Supabase (PostgreSQL, Auth, and Storage) |
| **AI & Search** | Google Gemini Vision API & Google Custom Search API |
| **Deployment** | Docker and Railway.app |

---

##  5. Team Information
**Team:** ModaByte  
**Course:** COMP 3304 — Fundamentals of Software Engineering  
**Instructor:** Dr. Suphi Ucar

* **Doga Pirci**
* **Selin Sermet**
* **Asli Goktalay**
* **Arda Ceran**
