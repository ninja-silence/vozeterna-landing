export const mobileRoutes = {
  home: "/mobile",
  feed: "/mobile/feed",
  profiles: "/mobile/profiles",
  newProfile: "/mobile/profiles/new",
  library: "/mobile/library",
  collections: "/mobile/collections",
  record: "/mobile/record",
  upload: "/mobile/upload",
  consent: "/mobile/consent",
  account: "/mobile/account",
  connect: "/mobile/connect",
};

export function toMobileRoute(path) {
  if (!path) return mobileRoutes.home;

  const normalized = String(path);

  if (normalized.startsWith("/mobile")) return normalized;

  const replacements = [
    ["/app/upload", mobileRoutes.upload],
    ["/app/record", mobileRoutes.record],
    ["/app/consent-history", mobileRoutes.consent],
    ["/app/consent", mobileRoutes.consent],
    ["/app/loved-ones/new", mobileRoutes.newProfile],
    ["/app/loved-ones", mobileRoutes.profiles],
    ["/app/library", mobileRoutes.library],
    ["/app/collections", mobileRoutes.collections],
    ["/app/account", mobileRoutes.account],
    ["/app/profile", mobileRoutes.account],
    ["/app/login", mobileRoutes.account],
    ["/app/mobile", mobileRoutes.home],
    ["/app", mobileRoutes.home],
  ];

  for (const [from, to] of replacements) {
    if (normalized.startsWith(from)) {
      return normalized.replace(from, to);
    }
  }

  return normalized;
}