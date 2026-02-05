import type { NextConfig } from "next";

// CSP is only applied in production to avoid blocking Next.js dev mode features
const isDev = process.env.NODE_ENV === 'development'

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-XSS-Protection', value: '1; mode=block' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
]

// Only add CSP in production - dev mode needs eval for hot reload
if (!isDev) {
  securityHeaders.push({
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      // 'unsafe-inline' needed for theme script in layout.tsx to prevent flash
      // 'blob:' needed for Web Workers (Monte Carlo simulation)
      "script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' blob:",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob:",
      // html-to-image fetches Google Fonts to embed in canvas for copy-as-image
      "connect-src 'self' https://fonts.googleapis.com https://fonts.gstatic.com",
      // Web Workers are loaded as blob URLs
      "worker-src 'self' blob:",
      "frame-ancestors 'none'",
    ].join('; '),
  })
}

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ]
  },
};

export default nextConfig;
