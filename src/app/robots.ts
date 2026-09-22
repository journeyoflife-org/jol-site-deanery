import type { MetadataRoute } from 'next';
import { robotsDirectives } from '@journeyoflife-org/seo';
import { ORIGIN, PRE_LAUNCH } from '@/lib/site-config';

/**
 * Robots.txt — governed by the PRE_LAUNCH gate in site-config.ts.
 *
 * Pre-launch: Disallow: / for all agents (the site is noindexed and should
 * not be crawled at all). Once PRE_LAUNCH flips to false, all agents are
 * allowed and the sitemap URL is advertised.
 *
 * Uses `robotsDirectives()` from the platform seo package for the base
 * allow/disallow rules; the sitemap line is added only when indexing.
 */
export default function robots(): MetadataRoute.Robots {
  if (PRE_LAUNCH) {
    return {
      rules: { userAgent: '*', disallow: '/' },
    };
  }

  const base = robotsDirectives();

  return {
    rules: {
      userAgent: base.userAgent,
      allow: base.allow,
      disallow: base.disallow,
      crawlDelay: 1,
    },
    sitemap: `${ORIGIN}/sitemap.xml`,
  };
}
