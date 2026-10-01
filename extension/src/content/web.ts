// Content script injected into RootAccess Web App (root-access.site)
// Enables automatic detection and bi-directional token syncing without requiring hardcoded Extension IDs

function broadcastStatus() {
  if (typeof chrome === "undefined" || !chrome?.storage?.local) return;

  chrome.storage.local.get(["ra_session_token", "ra_user"], (res) => {
    window.postMessage(
      {
        source: "ROOT_ACCESS_EXTENSION",
        type: "RA_EXTENSION_STATUS",
        extId: chrome.runtime?.id || "",
        hasSession: Boolean(res?.ra_session_token),
        user: res?.ra_user || null,
      },
      "*"
    );
  });
}

// 1. Broadcast immediately when script executes
broadcastStatus();

// 2. Broadcast again when DOM is ready
if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", broadcastStatus);
  } else {
    setTimeout(broadcastStatus, 200);
    setTimeout(broadcastStatus, 1000);
  }
}

// 3. Listen to messages from the web app
window.addEventListener("message", (event) => {
  if (event.data?.source !== "ROOT_ACCESS_WEB") return;

  if (event.data.type === "CHECK_EXTENSION") {
    broadcastStatus();
  }

  if (event.data.type === "SET_SESSION") {
    const { token, user } = event.data;
    if (token && typeof chrome !== "undefined" && chrome?.storage?.local) {
      chrome.storage.local.set(
        {
          ra_session_token: token,
          ra_user: user,
          ra_connected_at: Date.now(),
        },
        () => {
          window.postMessage(
            {
              source: "ROOT_ACCESS_EXTENSION",
              type: "RA_SESSION_SAVED",
              extId: chrome.runtime?.id || "",
              ok: true,
            },
            "*"
          );
        }
      );
    }
  }
});
