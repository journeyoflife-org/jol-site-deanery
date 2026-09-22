import type { Config } from 'tailwindcss';

/**
 * JOL design-system tokens, mapped from the CSS custom properties published by
 * `@journeyoflife-org/ui/styles/tokens.css` (imported in the root layout).
 *
 * Every value is a `var(--jol-*)` reference, never a hex literal: INV-7
 * forbids spokes from defining their own theme, and
 * `scripts/check-theme-literals.sh` enforces it.
 *
 * `@journeyoflife-org/ui/tailwind` cannot be used as a preset — the published
 * 1.0.0 tarball ships `tailwind.config.ts` but its `files` allowlist omits
 * `src/tokens/tailwind.ts`, which that config imports, so resolving the preset
 * fails. Reported upstream; this mapping is the interim equivalent.
 *
 * Opacity modifiers: Tailwind v3 cannot apply `/10`-style alpha to a `var()`
 * colour, so the numeric scale steps are mapped explicitly and consumers use
 * `primary-50`, `primary-100`, … rather than `primary/10`.
 */
const SCALE = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const;

/** Build a Tailwind colour scale from the `--jol-color-{name}-{step}` tokens. */
function tokenScale(name: string): Record<string, string> {
  const scale: Record<string, string> = {};
  for (const step of SCALE) {
    scale[String(step)] = `var(--jol-color-${name}-${step})`;
  }
  return scale;
}

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: 'var(--jol-color-primary)', ...tokenScale('primary') },
        accent: { DEFAULT: 'var(--jol-color-accent)', ...tokenScale('accent') },
        neutral: tokenScale('neutral'),
        surface: {
          DEFAULT: 'var(--jol-surface)',
          muted: 'var(--jol-surface-muted)',
        },
        content: {
          DEFAULT: 'var(--jol-text)',
          muted: 'var(--jol-text-muted)',
        },
        border: 'var(--jol-border)',
        focus: 'var(--jol-focus)',
      },
    },
  },
  plugins: [],
};

export default config;
