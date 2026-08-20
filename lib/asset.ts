/**
 * Prefix a public asset path with the deploy basePath.
 *
 * Next automatically rewrites `<Link>`, `router.push`, and `_next/*` assets for
 * `basePath`, but NOT plain `<img src="/...">`. Use this for those references so
 * they resolve under a GitHub Pages subpath (e.g. /leonix-arena/assets/...).
 */
export function assetPath(p: string): string {
  const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  return base + p;
}
