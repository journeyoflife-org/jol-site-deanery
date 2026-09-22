import type { MetadataRoute } from 'next';
import { PRE_LAUNCH, ORIGIN } from '@/lib/site-config';

/**
 * Sitemap.xml — governed by the PRE_LAUNCH gate in site-config.ts.
 *
 * While pre-launch: returns an empty array (no URLs advertised to crawlers).
 * Once PRE_LAUNCH flips to false: emits entries for every public route.
 *
 * Page paths are listed below. As new routes are added to the spoke, add
 * them to PAGE_PATHS. Locale alternates are not emitted yet (the spoke
 * serves a single locale-less route); re-enable when [locale] routes land.
 */

/** All public page paths (locale-agnostic). */
const PAGE_PATHS = [
  '/',
  '/directory',
  '/events',
];

export default function sitemap(): MetadataRoute.Sitemap {
  if (PRE_LAUNCH) return [];

  return PAGE_PATHS.map((path) => ({
    url: path === '/' ? `${ORIGIN}/` : `${ORIGIN}${path}`,
    lastModified: new Date(),
    changeFrequency: path === '/' ? 'daily' as const : 'weekly' as const,
    priority: path === '/' ? 1.0 : 0.7,
  }));
}
