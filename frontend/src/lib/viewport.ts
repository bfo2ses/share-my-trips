// Single source of truth for the JS side of the mobile breakpoint — must stay
// in sync with the `@media (max-width: 768px)` convention used across the
// CSS modules.
export const MOBILE_QUERY = '(max-width: 768px)';

export function isMobileViewport(): boolean {
  return window.matchMedia(MOBILE_QUERY).matches;
}
