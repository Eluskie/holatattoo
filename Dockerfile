# Production Dockerfile for Hola Tattoo Bot Engine (Monorepo)
# Use Debian slim for better Prisma compatibility
FROM node:20.18.1-slim AS base

# Install OpenSSL and other dependencies for Prisma
RUN apt-get update -y && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy root package.json and workspace configs
COPY package.json package-lock.json* ./

# Copy all workspace packages (needed for npm workspaces to work)
COPY apps/bot-engine ./apps/bot-engine
COPY packages ./packages

# Install all dependencies (Prisma postinstall will generate client)
RUN npm ci

# Build stage
FROM base AS builder
WORKDIR /app

# Copy everything from deps stage (includes node_modules and source)
COPY --from=deps /app ./

# Build workspace packages in dependency order
RUN cd packages/shared-types && npm run build
RUN cd packages/database && npm run build

# Build bot-engine
RUN cd apps/bot-engine && npm run build

# Production stage
FROM base AS runner
WORKDIR /app

# Install curl for healthcheck
RUN apt-get update -y && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

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
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

# Start the application
CMD ["node", "dist/index.js"]
