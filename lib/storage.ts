import type { SupabaseClient } from '@supabase/supabase-js'

const BUCKET = 'locked-photos'
const URL_TTL_SECONDS = 60 * 60

// Resolve a list of bucket paths to time-limited signed URLs. Used after a
// match is fully revealed so the chat room can render the peer's photos
// without ever making the bucket public.
export async function signedUrls(
  supabase: SupabaseClient,
  paths: string[],
): Promise<string[]> {
  if (!paths.length) return []
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrls(paths, URL_TTL_SECONDS)
  if (error || !data) return []
  return data
    .filter((row) => !!row.signedUrl)
    .map((row) => row.signedUrl as string)
}

export async function signedUrl(
  supabase: SupabaseClient,
  path: string,
): Promise<string | null> {
  const [first] = await signedUrls(supabase, [path])
  return first ?? null
}

export const STORAGE_BUCKET = BUCKET
