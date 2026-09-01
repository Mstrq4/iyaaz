import { getLibraryTaxonomy } from '../../../lib/library/server.ts';

export async function GET(): Promise<Response> {
  const taxonomy = await getLibraryTaxonomy();
  return Response.json(taxonomy, {
    headers: { 'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400' },
  });
}
