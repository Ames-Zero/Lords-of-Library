export const APP_VIEWS = ["feed", "saved", "connections", "profile"] as const;
export type AppView = (typeof APP_VIEWS)[number];

export function normalizeAppView(raw: string | null): AppView {
  if (raw && (APP_VIEWS as readonly string[]).includes(raw)) {
    return raw as AppView;
  }
  return "feed";
}
