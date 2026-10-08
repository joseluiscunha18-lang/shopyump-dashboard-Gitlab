'use client';

import { createClient } from '@/lib/supabase/client';

/**
 * Wraps product-photo / store-banner uploads to Supabase Storage in one
 * place, replacing the copy-pasted upload logic scattered through the
 * legacy criar-produto.js (see architecture doc §6.4). Bucket names are
 * assumed from the storage URLs seen in the legacy manifest.json
 * ("Logo") — confirm against the real project and adjust BUCKETS below.
 */
import { BUCKETS } from '@/lib/storageBuckets';
export { BUCKETS };

export async function uploadImage(
  bucket: (typeof BUCKETS)[keyof typeof BUCKETS],
  file: File,
  pathPrefix: string
): Promise<{ url: string | null; error: string | null }> {
  const supabase = createClient();
  const ext = file.name.split('.').pop();
  const path = `${pathPrefix}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  });

  if (error) return { url: null, error: error.message };

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return { url: data.publicUrl, error: null };
}
