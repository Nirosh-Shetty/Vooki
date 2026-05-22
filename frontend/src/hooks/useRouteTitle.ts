import { usePathname } from "next/navigation";
import { useMemo } from "react";

/**
 * Custom hook to safely get page title based on current route
 * Handles null pathname and dynamic routes
 */
export function useRouteTitle(
  routeTitleMap: Record<string, string>,
  defaultTitle: string,
  dynamicRoutePrefixes?: { prefix: string; title: string }[]
): string {
  const pathname = usePathname();

  return useMemo(() => {
    // Handle null pathname
    if (!pathname) return defaultTitle;

    // Check dynamic route prefixes first (e.g., "/brand/campaigns/[id]")
    if (dynamicRoutePrefixes) {
      for (const { prefix, title } of dynamicRoutePrefixes) {
        if (pathname.startsWith(prefix)) {
          return title;
        }
      }
    }

    // Fall back to exact route match or default
    return routeTitleMap[pathname] ?? defaultTitle;
  }, [pathname, routeTitleMap, defaultTitle, dynamicRoutePrefixes]);
}

/**
 * Safely check if a pathname matches a href
 * Returns false if pathname is null
 */
export function isPathActive(pathname: string | null, href: string): boolean {
  if (!pathname) return false;
  if (pathname === href) return true;
  return pathname.startsWith(`${href}/`);
}
