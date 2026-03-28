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
| **Frontend & API** | Vite + React (TypeScript) and Tailwind CSS |
| **Database & Auth** | Supabase (PostgreSQL, Auth, and Storage) |
| **AI & Search** | Google Gemini Vision API & SerpApi (Google Images) |
| **Deployment** | Docker and Railway.app |

---

##  5. 🐳 Running with Docker (Recommended)

Docker ensures that everyone on the team has the exact same environment, avoiding "it works on my machine" issues.

### 🛠️ If you don't have Docker installed yet:

#### **Windows Users (Required Steps):**
1.  **Download:** Download [Docker Desktop for Windows](https://www.docker.com/products/docker-desktop/).
2.  **Install:** During installation, ensure **"Use WSL 2 instead of Hyper-V"** is checked.
3.  **WSL 2 Update:** If prompted, follow the link to update your Linux Kernel.
4.  **Restart:** Restart your computer after installation.
5.  **Verify:** Open a terminal and type `docker --version`.

#### **Mac/Linux Users:**
*   **Mac:** Download [Docker Desktop for Mac](https://www.docker.com/products/docker-desktop/).
*   **Linux:** Follow the [official engine installation guide](https://docs.docker.com/engine/install/).

---

### 🚀 Getting Started

1. **Clone the repository** (if you haven't already).
2. **Environment Setup:**
   Copy the template and fill in your API keys in `Backend/.env`:
   ```bash
   cp Backend/.env.example Backend/.env
   ```
3. **Start the System:**
   Run this command from the **root directory**:
   ```bash
   docker compose up --build
   ```
4. **Access the Application:**
   *   **Frontend:** [http://localhost:3000](http://localhost:3000)
   *   **Backend API:** [http://localhost:5000](http://localhost:5000)

---

### 💡 Useful Commands

*   **Stop:** `docker compose down`
*   **Restart after changes:** `docker compose up --build`
*   **View Logs:** `docker compose logs -f`

---

##  5. Team Information
**Team:** ModaByte  
**Course:** COMP 3304 — Fundamentals of Software Engineering  
**Instructor:** Dr. Suphi Ucar

* **Doga Pirci**
* **Selin Sermet**
* **Asli Goktalay**
* **Arda Ceran**
