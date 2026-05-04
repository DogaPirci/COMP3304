# Stage 1: Build the Frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/Frontend

# Accept build arguments from Render
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY

# Set them as environment variables so Vite can embed them during build
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY

# Install frontend dependencies
COPY Frontend/package*.json ./
RUN npm install

# Copy frontend source and build
COPY Frontend/ ./
# If using Vite/React, this usually builds to "dist". If Next.js, it might be "out" or ".next".
RUN npm run build

# Stage 2: Setup Backend and Production Server
FROM node:20-alpine
WORKDIR /app/Backend

# Install backend dependencies
COPY Backend/package*.json ./
RUN npm install

# Copy backend source code
COPY Backend/ ./

# Copy the built frontend artifacts into a 'public' directory inside Backend
# Note: If your frontend outputs to 'build' or 'out' instead of 'dist', change the path below.
COPY --from=frontend-builder /app/Frontend/dist ./public

# Railway dynamically assigns a PORT environment variable. We default to 5000.
ENV PORT=5000
EXPOSE 5000

# Start the application using compiled JS for better performance and to prevent module resolution errors
RUN npx tsc
CMD ["node", "dist/server.js"]
