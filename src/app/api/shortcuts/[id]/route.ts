import { findLibraryRecordById, loadLibraryRecords } from '../../../../lib/library/server.ts';

interface DetailContext {
  params: Promise<{ id: string }>;
}

const POSITIVE_INTEGER_ID = /^[1-9]\d*$/;

export async function GET(_request: Request, context: DetailContext): Promise<Response> {
  const { id: rawId } = await context.params;
  if (!POSITIVE_INTEGER_ID.test(rawId)) {
    return Response.json({ error: 'not_found' }, { status: 404 });
  }

  const id = Number(rawId);
  if (!Number.isSafeInteger(id)) {
    return Response.json({ error: 'not_found' }, { status: 404 });
  }

  const records = await loadLibraryRecords();
  const record = findLibraryRecordById(records, id);
  if (!record) return Response.json({ error: 'not_found' }, { status: 404 });

  return Response.json(record, {
    headers: { 'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400' },
  });
}
