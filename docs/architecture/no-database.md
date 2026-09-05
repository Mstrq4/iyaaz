# No-database architecture

The runtime source of truth is the versioned, sanitized library snapshot generated from the workbook. IYAAZ deliberately has no Supabase/PostgreSQL runtime dependency. Search/detail data is served from repository-versioned JSON/Brotli content; browser-local personalization remains in Web Storage.
