#!/bin/sh
set -e

echo "Running database migrations..."
npx prisma migrate deploy --schema=/app/packages/database/prisma/schema.prisma

echo "Starting Next.js server..."
exec node /app/apps/dashboard/server.js

