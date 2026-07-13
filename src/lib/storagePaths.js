const STORAGE_BUCKET = "family-media";

export function normalizeStoragePath(path) {
  if (path === null || path === undefined) return "";

  let value = String(path).trim();
  if (!value) return "";

  try {
    const url = new URL(value);
    const marker = `/${STORAGE_BUCKET}/`;
    const markerIndex = url.pathname.indexOf(marker);

    if (markerIndex >= 0) {
      value = url.pathname.slice(markerIndex + marker.length);
    } else {
      const objectMarker = `/object/`;
      const objectIndex = url.pathname.indexOf(objectMarker);

      if (objectIndex >= 0) {
        const objectPath = url.pathname.slice(objectIndex + objectMarker.length);
        value = objectPath.replace(/^public\//, "");
      }
    }
  } catch {
    // Plain storage object paths are expected for normal app data.
  }

  value = value.replace(/^\/+/, "");

  if (value.startsWith(`${STORAGE_BUCKET}/`)) {
    value = value.slice(STORAGE_BUCKET.length + 1);
  }

  if (value.startsWith(`public/${STORAGE_BUCKET}/`)) {
    value = value.slice(`public/${STORAGE_BUCKET}/`.length);
  }

  return value.trim();
}

export function warnInvalidStoragePath(context, rawPath) {
  if (process.env.NODE_ENV !== "development") return;
  console.warn(`[VozEterna] Skipped invalid storage path in ${context}:`, rawPath);
}
