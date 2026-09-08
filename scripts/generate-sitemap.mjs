/**
 * Generates public/sitemap.xml from the data files, so the sitemap cannot drift
 * out of sync with the catalogue. Runs automatically before every build.
 *
 * Slugs are read with a regular expression rather than by importing the modules:
 * the data files are TypeScript, and adding a TS loader to the build pipeline
 * for two `readFile` calls would not be a good trade.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ORIGIN = 'https://healthcare-labs.com';

const slugsFrom = (relPath) => {
  const src = readFileSync(resolve(root, relPath), 'utf8');
  return [...src.matchAll(/^\s{4}slug:\s*'([a-z0-9-]+)',$/gm)].map((m) => m[1]);
};

const packageSlugs = slugsFrom('src/data/packages.ts');
const postSlugs = slugsFrom('src/data/blogs.ts');

const today = new Date().toISOString().slice(0, 10);

/** @type {{loc: string, priority: string, changefreq: string}[]} */
const urls = [
  { loc: '/', priority: '1.0', changefreq: 'weekly' },
  { loc: '/health-package', priority: '0.9', changefreq: 'weekly' },
  { loc: '/my-offers', priority: '0.8', changefreq: 'weekly' },
  { loc: '/about-us', priority: '0.7', changefreq: 'monthly' },
  { loc: '/blog', priority: '0.7', changefreq: 'weekly' },
  { loc: '/contact-us', priority: '0.7', changefreq: 'monthly' },
  { loc: '/privacy-policy', priority: '0.3', changefreq: 'yearly' },
  { loc: '/terms', priority: '0.3', changefreq: 'yearly' },
  ...packageSlugs.map((s) => ({
    loc: `/health-package/${s}`,
    priority: '0.8',
    changefreq: 'monthly',
  })),
  ...postSlugs.map((s) => ({ loc: `/blog/${s}`, priority: '0.6', changefreq: 'monthly' })),
];

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <url>
    <loc>${ORIGIN}${u.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`,
  )
  .join('\n')}
</urlset>
`.replace('http://www.sitemap.org', 'http://www.sitemaps.org');

writeFileSync(resolve(root, 'public/sitemap.xml'), xml, 'utf8');

console.log(
  `sitemap.xml written — ${urls.length} URLs (${packageSlugs.length} packages, ${postSlugs.length} articles)`,
);
