# Vogue Vault - Backend

This is the **Kitchen** of our application. 

### 🍳 Simple Explanation (What does this do?)
Imagine a restaurant:
1.  The **Backend** is the **Kitchen**. It doesn't have a face, but it does all the cooking.
2.  It takes "Orders" (API requests) from the Frontend.
3.  It talks to the **AI (Gemini)** to ask: "Hey, what is this piece of clothing?"
4.  It talks to the **Database (Supabase)** to say: "Save this shirt in the closet!"
5.  It sends the finished "Meal" (Data) back to the Frontend to show the user.

---

## Prerequisites
- Node.js (v18+)
- Gemini API Key
- Google Custom Search API Key & Engine ID

## Local Development
1. Navigate to the Backend folder:
   ```bash
   cd Backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `Backend` directory:
   ```env
   PORT=5000
   GEMINI_API_KEY="your_gemini_key_here"
   GOOGLE_SEARCH_API_KEY="your_google_key_here"
   GOOGLE_SEARCH_ENGINE_ID="your_search_engine_id_here"
   ```
4. Start the server (usually on http://localhost:5000):
   ```bash
   npx ts-node src/server.ts
   ```

## 🐳 Docker Deployment & Architecture

Because we are deploying both the Frontend and Backend to a single Railway container, the **Backend acts as the master server** that hosts both the API and the static React files.

### How to Run with Docker Locally
If you want to test the full production build locally on your machine, you must run these commands from the **root project directory** (`../`), not inside this Backend folder:

1. **Build the Docker Image**:
   ```bash
   docker build -t vogue-vault-app .
   ```
2. **Run the Container**:
   ```bash
   docker run -p 5000:5000 \
     -e GEMINI_API_KEY="your_gemini_key" \
     -e GOOGLE_SEARCH_API_KEY="your_google_key" \
     -e GOOGLE_SEARCH_ENGINE_ID="your_engine_id" \
     vogue-vault-app
   ```
Instead of manually typing the long run command with all the environment variables, it's best to connect your repository to Railway.app—Railway securely detects the root `Dockerfile` and injects your variables from their dashboard automatically!
