/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb', // necessário para importação de planilhas Excel grandes
    },
  },
};

module.exports = nextConfig;
