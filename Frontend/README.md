# Vogue Vault - Frontend

This is the React / Next.js frontend UI for the Vogue Vault digital twin and smart commerce application.

## Prerequisites
- Node.js (v18+)
- Backend API Running (default: `http://localhost:5000`)

## Local Development
1. Navigate to the Frontend folder:
   ```bash
   cd Frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Environment Setup (Optional):
   The frontend automatically defaults to `http://localhost:5000`. If your backend is hosted elsewhere, set:
   ```env
   VITE_API_URL="your_backend_url" 
   # OR NEXT_PUBLIC_API_URL="your_backend_url"
   ```
4. Start the development server (depending on your setup):
   ```bash
   npm run dev
   ```

## Production & Docker Architecture
You do **not** need to map a volume or run a separate Docker container for the Frontend in production! 

The `Dockerfile` located in the **root** of the project automatically:
1. Installs your Frontend dependencies.
2. Runs `npm run build` to create highly optimized static files.
3. Moves these static files into the Backend's server automatically where they are served efficiently on a single unified port.
4. **Never** include your `.env` or `node_modules` inside the Docker image; the `.dockerignore` file prevents this.
