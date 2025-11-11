/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@hola-tattoo/database', '@hola-tattoo/shared-types'],
  serverExternalPackages: ['@prisma/client'], // Only Prisma, not our local packages
  output: 'standalone', // Required for Docker deployment
}

module.exports = nextConfig
