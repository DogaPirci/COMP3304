# 👗 Vogue Vault: How the System Works (For Dummies)

Welcome to the Vogue Vault architecture! If you're a developer on this project, here is exactly how everything connects using a simple **Restaurant Analogy**.

---

## 🤵 1. The Frontend (The Waiter)
- **Location**: `/Frontend` folder.
- **Role**: This is what the user touches. It's the "Waiter" who takes the order.
- **Example**: When a user clicks "Upload Image", the Frontend (Waiter) says: "I have an order! Someone wants to save a shirt."
- **Communication**: It sends this order to the **Backend (Kitchen)**. It doesn't know *how* to save it; it just knows *who* to ask.

## 🍳 2. The Backend (The Kitchen)
- **Location**: `/Backend` folder.
- **Role**: This is where the magic happens. It's the "Kitchen".
- **Key Logic**: 
    - **Step A**: It receives the photo.
    - **Step B**: It asks our **Master Chef (Gemini AI)**: "What is this?"
    - **Step C**: Gemini replies: "It's a Blue Top with 95% certainty."
    - **Step D**: The Kitchen then writes this down in our **Logbook (Supabase Database)**.
- **Success**: Once done, it tells the Waiter (Frontend): "Order complete! Here is the data."

## 🥫 3. Supabase (The Pantry & Warehouse)
- **Role**: This is where we store everything forever.
- **Database**: Where we keep the text (User info, item names, categories).
- **Storage**: Where we keep the actual image files.

## 🤖 4. Gemini AI (The Fashion Specialist)
- **Role**: This is a consultant we hire to look at images.
- **Why?**: Because computers are "dumb" and don't know what a "skirt" looks like without help. Gemini looks at the pixels and tells us the category in JSON format.

---

## 🛠️ How to run it (The "Go" Buttons)

1.  **Start the Kitchen (Backend)**:
    - Go to `Backend` folder -> `npm run dev`
    - It runs on **Port 5000**.
2.  **Start the Waiter (Frontend)**:
    - Go to `Frontend` folder -> `npm run dev`
    - It runs on **Port 3000**.
3.  **The Secret Bridge (Proxy)**:
    - Notice that the Waiter (3000) needs to talk to the Kitchen (5000). We have a "Secret Bridge" set up in `vite.config.ts` so the Waiter doesn't get lost.

---

### ⚠️ IMPORTANT: The Secret Sauce (.env)
We don't share our secret recipes in public. The API keys (Gemini, Supabase) are kept in **`.env`** files. 
- **NEVER** delete these.
- **NEVER** push these to GitHub.
- They are ignored by the system so they stay safe on your machine.
