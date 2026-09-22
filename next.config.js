/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Remove X-Powered-By: Next.js (information disclosure — tells attackers
  // the framework and version, narrowing their exploit search).
  poweredByHeader: false,

  // Tenant resolution via X-Tenant header or subdomain
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // --- MIME sniffing / clickjacking (pre-existing, retained) ---
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },

          // --- X-XSS-Protection: DELIBERATELY OMITTED ---
          // The XSS Auditor was removed from Chrome 78+ (2019), Firefox, and
          // Safari. Setting `1; mode=block` on modern browsers is a no-op at
          // best and, on legacy Edge/Chrome, an exploitable side-channel
          // (CVE-2019-13258). CSP subsumes this header's original purpose.

          // --- Content Security Policy ---
          // Baseline: every resource from same origin, inline allowed only
          // for <style> (Next.js injects critical CSS). No external scripts,
          // fonts, images, or connections. Tighten further as the spoke grows.
          //
          // script-src  'self'        — Next.js bundles + __NEXT_DATA__ (same-origin)
          // style-src   'self' 'unsafe-inline' — Tailwind output is same-origin CSS;
          //                               'unsafe-inline' is required because Next.js
          //                               injects <style> tags for critical CSS at runtime
          // img-src     'self' data:  — data: for future SVG / inline image use
          // connect-src 'self'        — no external APIs or analytics yet
          // frame-ancestors 'none'    — CSP-level clickjacking guard (mirrors X-Frame-Options)
          // base-uri    'self'        — prevents <base> tag injection
          // form-action 'self'        — no external form targets
          // object-src  'none'        — no <object>, <embed>, <applet>
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data:",
              "font-src 'self'",
              "connect-src 'self'",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "object-src 'none'",
            ].join('; '),
          },

          // --- HSTS (1 year, subdomains) ---
          // Typically set by the edge/CDN; repeating it here is defense-in-depth.
          // Browsers that see it from either source will enforce HTTPS for 1 year.
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },

          // --- Referrer Policy ---
          // Full URL on same-origin requests; origin-only on cross-origin.
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },

          // --- Permissions Policy ---
          // Lock down browser features this spoke does not use.
          {
            key: 'Permissions-Policy',
            value: [
              'camera=()',
              'microphone=()',
              'geolocation=()',
              'payment=()',
            ].join(', '),
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
