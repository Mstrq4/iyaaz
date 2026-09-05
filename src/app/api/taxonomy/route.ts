import { requireReadApiAccess } from '../../../lib/access/api.ts';
import { getLibraryTaxonomy } from '../../../lib/library/server.ts';

export async function GET(request?: Request): Promise<Response> {
  const denied = await requireReadApiAccess(request);
  if (denied) return denied;

  const taxonomy = await getLibraryTaxonomy();
  return Response.json(taxonomy, {
    headers: { 'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400' },
  });
}
