# Step 1: Build phase
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Step 2: Ultra-fast production execution phase
FROM node:22-alpine
WORKDIR /app

# Only copy what is absolutely needed to eliminate server bloat
COPY package*.json ./
RUN npm install --omit=dev
COPY --from=builder /app/dist ./dist

EXPOSE 8080
ENV PORT=8080
ENV NODE_ENV=production

# Bypass npm overhead and boot the server file instantly
CMD ["node", "dist/server.cjs"]
