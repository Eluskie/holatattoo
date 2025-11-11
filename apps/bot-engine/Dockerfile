# Production Dockerfile for Hola Tattoo Bot Engine
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./
COPY packages/database/package.json ./packages/database/
COPY packages/shared-types/package.json ./packages/shared-types/

# Install dependencies
RUN npm ci

# Build stage
FROM base AS builder
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages ./packages

# Copy source code
COPY apps/bot-engine ./apps/bot-engine
COPY packages ./packages
COPY package.json package-lock.json* ./

# Generate Prisma Client
RUN cd packages/database && npx prisma generate

# Build the application
RUN cd apps/bot-engine && npm run build

# Production stage
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy built application
COPY --from=builder /app/apps/bot-engine/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/bot-engine/package.json ./package.json

# Expose port
EXPOSE 3001

# Start the application
CMD ["node", "dist/index.js"]
