import { defineConfig } from 'astro/config';

// Served from https://amitrm.github.io/2026-30d-maps/
export default defineConfig({
  site: 'https://amitrm.github.io',
  base: '/2026-30d-maps',
  trailingSlash: 'always',
  build: { format: 'directory' },
});
