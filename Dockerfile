# Stage 1: Build the React frontend
FROM node:18-slim AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Stage 2: Setup the Node.js backend
FROM node:18-slim AS backend-runtime
WORKDIR /app
COPY backend/package.json backend/package-lock.json ./
RUN npm install --production

COPY backend/ ./

# Copy built frontend from the first stage
COPY --from=frontend-builder /app/frontend/dist /app/public

# Install a simple static server to serve the frontend
RUN npm install -g serve

# Expose the port the app will run on
EXPOSE 3000

# Start both the backend and the frontend server
# The backend will run on port 3000, and the frontend will be served on port 3001
CMD sh -c 'node server.js & serve -s public -l 3001'
