import { findLibraryRecordById, loadLibraryRecords } from '../../../../lib/library/server.ts';

interface DetailContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, context: DetailContext): Promise<Response> {
  const { id: rawId } = await context.params;
  const id = Number.parseInt(rawId, 10);
  if (!Number.isInteger(id) || id < 1) {
    return Response.json({ error: 'not_found' }, { status: 404 });
  }

  const records = await loadLibraryRecords();
  const record = findLibraryRecordById(records, id);
  if (!record) return Response.json({ error: 'not_found' }, { status: 404 });

  return Response.json(record, {
    headers: { 'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400' },
  });
}
