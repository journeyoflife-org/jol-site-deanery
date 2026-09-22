import type { Metadata } from 'next';
import {
  absoluteCanonical,
  breadcrumbListEntity,
  clampDescription,
  type Json,
} from '@journeyoflife-org/seo';
import tenantFixture from '@/fixtures/tenant.json';
import { DEFAULT_LOCALE, resolveLocale, type LocalizedText } from '@/lib/resolve-locale';

/**
 * Typed view of `src/fixtures/tenant.json`.
 *
 * The fixture has no schema yet (a Phase 2 deliverable), so the JSON import is
 * asserted once, here, at the boundary; everything downstream is fully typed.
 * This replaces the scattered `as any` casts that let the previous JSON-LD
 * contract mismatch ship unnoticed.
 */
interface HeroBlock {
  type: 'hero';
  heading: LocalizedText;
  body: LocalizedText;
}

interface StatsBlock {
  type: 'stats';
  heading: LocalizedText;
  items: Array<{ label: LocalizedText; value: number }>;
}

interface CtaBlock {
  type: 'cta';
  links: Array<{ label: LocalizedText; href: string }>;
}

interface TenantFixture {
  slug: string;
  vertical: string;
  name: LocalizedText;
  tagline: LocalizedText;
  identity: {
    jurisdiction?: string;
    domain: string;
  };
  pages: Array<{
    route: string;
    title: LocalizedText;
    contentBlocks: Array<HeroBlock | StatsBlock | CtaBlock>;
  }>;
}

const tenant = tenantFixture as TenantFixture;

/**
 * Public origin. `identity.domain` is a bare host, but every SEO URL must be
 * absolute (SEO hard rule 1) and `sanitizeOrigin` rejects a schemeless host.
 */
const ORIGIN = `https://${tenant.identity.domain}`;

const HTML_ESCAPES: Record<string, string> = {
  '<': '\\u003c',
  '>': '\\u003e',
  '&': '\\u0026',
};

/**
 * Serialize a JSON-LD entity for an inline `<script>`. HTML-significant
 * characters are escaped so page content can never terminate the element.
 */
function toJsonLd(entity: Json): { __html: string } {
  return {
    __html: JSON.stringify(entity).replace(/[<>&]/g, (character) => HTML_ESCAPES[character] ?? character),
  };
}

export function generateMetadata(): Metadata {
  return {
    description: clampDescription(resolveLocale(tenant.tagline, DEFAULT_LOCALE)),
    // Canonical only. hreflang alternates are deliberately NOT emitted: this
    // spoke serves a single locale-less route, so advertising /en and /ru
    // would point at URLs that do not exist. Re-enable via `buildHreflangSet`
    // once `[locale]` routes land.
    alternates: { canonical: absoluteCanonical(ORIGIN, '/') },
  };
}

export default function DeaneryPage() {
  const locale = DEFAULT_LOCALE;
  const t = (text: LocalizedText): string => resolveLocale(text, locale);

  const blocks = tenant.pages.find((page) => page.route === '/')?.contentBlocks ?? [];
  const hero = blocks.find((block): block is HeroBlock => block.type === 'hero');
  const stats = blocks.find((block): block is StatsBlock => block.type === 'stats');
  const cta = blocks.find((block): block is CtaBlock => block.type === 'cta');

  const name = t(tenant.name);
  const url = absoluteCanonical(ORIGIN, '/');

  // The ReligiousOrganization entity is deliberately NOT emitted yet.
  //
  // `churchEntity({ kind: 'deanery' })` maps a deanery to ReligiousOrganization
  // (a regional coordination body, not a church building) and requires an
  // `address`. The fixture carries one, but it is neither rendered on this page
  // nor verified, and structured data must describe visible, verified content.
  // The page is also noindexed pre-launch, so emitting it would add risk with
  // no SEO benefit.
  //
  // TODO(Phase 2): emit `churchEntity({ kind: 'deanery', ... })` once the
  // deanery address is (1) structured as PostalAddressInput in the fixture,
  // (2) verified, and (3) visibly rendered on the page.
  const breadcrumb = breadcrumbListEntity([{ name, url }]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={toJsonLd(breadcrumb)} />

      {hero ? (
        <section className="bg-primary-50 py-16 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl font-bold mb-4">{t(hero.heading)}</h1>
            <p className="text-lg text-content-muted">{t(hero.body)}</p>
          </div>
        </section>
      ) : null}

      {stats ? (
        <section aria-labelledby="deanery-stats" className="py-12 px-4">
          <div className="max-w-4xl mx-auto">
            <h2 id="deanery-stats" className="text-2xl font-semibold mb-6 text-center">
              {t(stats.heading)}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {stats.items.map((item) => (
                <div key={item.label.lt} className="text-center p-4 bg-surface-muted rounded-lg">
                  <div className="text-3xl font-bold text-primary">{item.value}</div>
                  <div className="text-sm text-content-muted mt-1">{t(item.label)}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {cta ? (
        <section className="py-12 px-4 bg-surface-muted">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-wrap gap-4 justify-center">
              {cta.links.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="px-6 py-3 bg-primary-100 text-primary-900 rounded-lg hover:bg-primary-200 transition-colors font-medium"
                >
                  {t(link.label)}
                </a>
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}
