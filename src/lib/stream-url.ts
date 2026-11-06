/**
 * Builds listener-facing stream URLs for Icecast mounts.
 */
export function getPublicStreamBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_STREAM_BASE_URL) {
    return process.env.NEXT_PUBLIC_STREAM_BASE_URL.replace(/\/$/, "");
  }
  const host = process.env.STREAM_ICECAST_HOST || "localhost";
  const port = process.env.STREAM_ICECAST_PORT || "8010";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const protocol = appUrl.startsWith("https") ? "https" : "http";
  return `${protocol}://${host}:${port}`;
}

export function buildMountStreamUrl(mountPath: string, portRelay?: number): string {
  const base = getPublicStreamBaseUrl();
  if (portRelay && !process.env.NEXT_PUBLIC_STREAM_BASE_URL) {
    const host = process.env.STREAM_ICECAST_HOST || "localhost";
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const protocol = appUrl.startsWith("https") ? "https" : "http";
    return `${protocol}://${host}:${portRelay}${mountPath.startsWith("/") ? mountPath : `/${mountPath}`}`;
  }
  const path = mountPath.startsWith("/") ? mountPath : `/${mountPath}`;
  return `${base}${path}`;
}
