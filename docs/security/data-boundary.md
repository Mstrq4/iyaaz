# Data Boundary

IYAAZ does not use Supabase or another production database and does not call AI model APIs.

The published library snapshot excludes source/reference columns and URL-like content before it reaches the browser. Current prompt state is browser-session data; favorites, history, client profiles, and user preferences are browser-local data. The application does not expose an image/file upload path.

Private/shared access modes use stateless signed tokens/cookies rather than persistent user records. Client-side hiding is never treated as an authorization boundary.
