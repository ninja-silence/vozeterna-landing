export async function cleanupUploadedFile(
  supabase,
  bucket,
  path,
  label = "uploaded file"
) {
  if (!supabase || !bucket || !path) return;

  const { error } = await supabase.storage.from(bucket).remove([path]);
  if (error) {
    console.warn(`[VozEterna] Could not clean up ${label}:`, error.message);
  }
}
