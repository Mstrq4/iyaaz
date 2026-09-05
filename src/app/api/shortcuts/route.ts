import { requireReadApiAccess } from '../../../lib/access/server.ts';
import { findLibraryRecordById, loadLibraryRecords } from '../../../lib/library/server';
import { parseWorkspaceRecordIds } from '../../../lib/workspace/records';

export async function GET(request: Request) {
  const denied = await requireReadApiAccess();
  if (denied) return denied;

  const ids = parseWorkspaceRecordIds(new URL(request.url).searchParams.get('ids'));
  if (!ids) return Response.json({ error: 'invalid_ids' }, { status: 400 });

  const records = await loadLibraryRecords();
  const items = ids.flatMap((id) => {
    const record = findLibraryRecordById(records, id);
    return record ? [record] : [];
  });
  return Response.json({ items });
}
