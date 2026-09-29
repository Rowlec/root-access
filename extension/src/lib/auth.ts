export async function getStoredToken(): Promise<string | null> {
  return new Promise((resolve) => {
    if (!chrome?.storage?.local) {
      resolve(localStorage.getItem("ra_session_token"));
      return;
    }
    chrome.storage.local.get(["ra_session_token"], (res) => {
      resolve(res.ra_session_token ?? null);
    });
  });
}

export async function setStoredToken(token: string): Promise<void> {
  return new Promise((resolve) => {
    if (!chrome?.storage?.local) {
      localStorage.setItem("ra_session_token", token);
      resolve();
      return;
    }
    chrome.storage.local.set({ ra_session_token: token }, () => {
      resolve();
    });
  });
}

export async function clearStoredSession(): Promise<void> {
  return new Promise((resolve) => {
    if (!chrome?.storage?.local) {
      localStorage.removeItem("ra_session_token");
      resolve();
      return;
    }
    chrome.storage.local.remove(
      ["ra_session_token", "ra_user", "ra_active_project_id"],
      () => {
        resolve();
      },
    );
  });
}
