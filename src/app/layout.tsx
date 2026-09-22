import type { Metadata } from 'next';
import { clampDescription, tenantTitleTemplate } from '@journeyoflife-org/seo';
import tenant from '@/fixtures/tenant.json';
import { DEFAULT_LOCALE, resolveLocale } from '@/lib/resolve-locale';
import './globals.css';

/**
 * Root layout — consumed by all pages in this vertical.
 *
 * Invariants enforced:
 * - DS-A11Y-01: html lang attribute
 * - DS-A11Y-07: skip-navigation link
 * - Security headers via next.config.js
 */

const tenantName = resolveLocale(tenant.name, DEFAULT_LOCALE);

export const metadata: Metadata = {
  // Shared "%s | {tenant name}" template. Previously this hardcoded a title
  // while page.tsx set a conflicting one, and the internal tenant slug leaked
  // into the public SERP title.
  title: tenantTitleTemplate(tenantName),
  description: clampDescription(resolveLocale(tenant.tagline, DEFAULT_LOCALE)),
  // Pre-launch indexation guard. This spoke still renders unverified fixture
  // content and has no locale routes; keep it out of the index until Phase 2
  // sign-off, matching jol-site-basilica's posture. `robotsPolicyFor('home')`
  // returns index:true, so the override is explicit rather than inherited.
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang={DEFAULT_LOCALE}>
      <body>
        {/* DS-A11Y-07: skip-navigation link. Localized to match `lang`,
            previously hardcoded English on a Lithuanian document. */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 focus:z-50 focus:bg-white focus:p-2"
        >
          Pereiti prie pagrindinio turinio
        </a>
        <main id="main-content">{children}</main>
      </body>
    </html>
  );
}
