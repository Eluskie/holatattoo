# Production Dockerfile for Hola Tattoo Bot Engine (Monorepo)
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy root package.json and workspace configs
COPY package.json package-lock.json* ./

# Copy all package.json files for workspace dependencies
COPY apps/bot-engine/package.json ./apps/bot-engine/
COPY packages/database/package.json ./packages/database/
COPY packages/shared-types/package.json ./packages/shared-types/

# Copy Prisma schema BEFORE npm ci (needed for postinstall hook)
COPY packages/database/prisma ./packages/database/prisma

# Install all dependencies (Prisma postinstall will generate client)
RUN npm ci

# Build stage
FROM base AS builder
WORKDIR /app

# Copy dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package.json ./package.json

# Copy source code
COPY apps/bot-engine ./apps/bot-engine
COPY packages ./packages

# Generate Prisma Client
RUN cd packages/database && npx prisma generate

# Build workspace packages in dependency order
RUN cd packages/shared-types && npm run build
RUN cd packages/database && npm run build

# Build bot-engine
RUN cd apps/bot-engine && npm run build

# Production stage
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001

# Copy necessary files
COPY --from=builder /app/apps/bot-engine/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/database ./packages/database
COPY --from=builder /app/apps/bot-engine/package.json ./package.json

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => {if(r.statusCode !== 200) throw new Error('Health check failed')})"

# Start the application
CMD ["node", "dist/index.js"]
