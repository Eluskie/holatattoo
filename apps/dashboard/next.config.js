/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@hola-tattoo/database', '@hola-tattoo/shared-types'],
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client'],
  },
}

module.exports = nextConfig
