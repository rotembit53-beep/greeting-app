import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

/**
 * Content-Security-Policy.
 *
 * `connect-src 'self'` is the load-bearing directive: it blocks a script from
 * exfiltrating anything to an attacker origin, which is what closes the XSS →
 * localStorage-token-theft chain even if a dangerous href ever slipped
 * through. `frame-ancestors 'none'` blocks clickjacking; `object-src 'none'`
 * and `base-uri 'self'` remove classic injection sinks.
 *
 * `'unsafe-inline'` is required for scripts and styles because Next's App
 * Router emits inline bootstrap scripts and the UI uses inline style props /
 * GSAP; a nonce pipeline would be the stricter follow-up. Dev additionally
 * needs `'unsafe-eval'` and websocket connections for React Fast Refresh, so
 * those are granted only when not building for production.
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "media-src 'self' blob:",
  "font-src 'self'",
  `connect-src 'self'${isDev ? " ws: http://localhost:*" : ""}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      // Security headers everywhere.
      { source: "/:path*", headers: securityHeaders },
      // Greeting links carry third-party personal detail and are meant to be
      // shared privately, not indexed; uploaded media shouldn't be crawled
      // either. Marketing pages ("/", "/create") stay indexable.
      { source: "/g/:slug*", headers: [{ key: "X-Robots-Tag", value: "noindex" }] },
      { source: "/api/media/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex" }] },
    ];
  },
};

export default nextConfig;

import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
initOpenNextCloudflareForDev();
