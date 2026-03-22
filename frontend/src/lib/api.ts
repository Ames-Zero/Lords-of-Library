export type ViewerProfile = {
  username: string;
  avatarUrl: string | null;
};

export async function getViewerProfile(): Promise<ViewerProfile> {
  return {
    username: "Demo User",
    avatarUrl: null,
  };
}
