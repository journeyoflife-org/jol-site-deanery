/**
 * Site-wide configuration derived from the tenant fixture.
 *
 * This is the single source of truth for the public origin and the
 * pre-launch indexing gate. Both robots.ts and sitemap.ts consume these
 * values so that a go-live edit (flipping PRE_LAUNCH → false) takes effect
 * in exactly one place.
 */
import tenant from '@/fixtures/tenant.json';

/** Public origin (scheme + host). All canonical/sitemap URLs derive from this. */
export const ORIGIN = `https://${tenant.identity.domain}`;

/**
 * Pre-launch indexing gate.
 *
 * While true:
 * - robots.ts returns Disallow: / for all agents (no crawling)
 * - sitemap.ts returns an empty array (no URLs advertised)
 * - layout.tsx sets noindex,nofollow meta
 *
 * Flip to false ONLY after:
 * 1. All page content is verified (no TODO markers in fixture)
 * 2. Clergy names are replaced with verified real data
 * 3. Locale routes are live (hreflang alternates can be emitted)
 * 4. Explicit release approval from the product owner
 */
export const PRE_LAUNCH = true;
