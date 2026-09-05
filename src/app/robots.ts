import type { MetadataRoute } from 'next';

import { readAccessConfig } from '../lib/access/config.ts';
import { getSiteOrigin } from '../lib/seo/site.ts';

const PRIVATE_PATHS = [
  '/ar/favorites',
  '/en/favorites',
  '/ar/history',
  '/en/history',
  '/ar/clients',
  '/en/clients',
  '/ar/access',
  '/en/access',
  '/api/',
];

export default function robots(): MetadataRoute.Robots {
  const mode = readAccessConfig().mode;
  if (mode !== 'public') {
    return {
      rules: {
        userAgent: '*',
        disallow: '/',
      },
    };
  }

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: PRIVATE_PATHS,
    },
    sitemap: new URL('/sitemap.xml', getSiteOrigin()).toString(),
  };
}
