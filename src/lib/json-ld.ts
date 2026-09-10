/**
 * JSON-LD structured data for the basilica landing page.
 *
 * Uses the Church entity builder pattern from @jol-hub/seo.
 * TODO: replace with import from @jol-hub/seo when packages are published.
 *
 * Schema types per page spec 03 SS3:
 *   Church + CatholicChurch + PlaceOfWorship
 *   + parentOrganization (diocese)
 *
 * Mass schedule emits Event JSON-LD with startDate (NOT openingHoursSpecification).
 */

interface JsonLdInput {
  name: string;
  url: string;
  address: {
    streetAddress: string;
    addressLocality: string;
    postalCode: string;
    addressCountry: string;
  };
  geo?: { latitude: number; longitude: number };
  telephone?: string;
  description?: string;
  parentOrg?: { name: string; url?: string };
  image?: string;
}

/**
 * Build Church entity JSON-LD.
 *
 * Kind='basilica' with preciseCatholic=true emits:
 *   @type: ["Church", "CatholicChurch", "PlaceOfWorship"]
 *
 * The kind vocabulary is DATA (entity-graph controlled), not a hardcoded
 * denomination label in component code (DS-THEME-01).
 */
export function buildChurchEntity(input: JsonLdInput): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': ['Church', 'CatholicChurch', 'PlaceOfWorship'],
    name: input.name,
    url: input.url,
    description: input.description,
    ...(input.image ? { image: input.image } : {}),
    address: {
      '@type': 'PostalAddress',
      streetAddress: input.address.streetAddress,
      addressLocality: input.address.addressLocality,
      postalCode: input.address.postalCode,
      addressCountry: input.address.addressCountry,
    },
    ...(input.geo
      ? { geo: { '@type': 'GeoCoordinates', ...input.geo } }
      : {}),
    ...(input.telephone ? { telephone: input.telephone } : {}),
    ...(input.parentOrg
      ? {
          parentOrganization: {
            '@type': 'ReligiousOrganization',
            name: input.parentOrg.name,
            ...(input.parentOrg.url ? { url: input.parentOrg.url } : {}),
          },
        }
      : {}),
  };
}

/**
 * Build Event JSON-LD for a mass schedule entry.
 * Uses startDate (NOT openingHoursSpecification — that models visitor hours).
 */
export function buildMassEvent(input: {
  name: string;
  startDate: string;
  location: { name: string; address: Record<string, string> };
}): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: input.name,
    startDate: input.startDate,
    location: {
      '@type': 'Place',
      name: input.location.name,
      address: {
        '@type': 'PostalAddress',
        ...input.location.address,
      },
    },
  };
}

/**
 * Build BreadcrumbList JSON-LD.
 */
export function buildBreadcrumb(items: Array<{ name: string; url: string }>): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
