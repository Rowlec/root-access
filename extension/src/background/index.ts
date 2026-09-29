// Chrome Extension Service Worker

chrome.runtime.onInstalled.addListener((details) => {
  // Configure sidepanel behavior
  if (chrome.sidePanel && chrome.sidePanel.setPanelBehavior) {
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch((err) => {
      console.warn("[RootAccess] setPanelBehavior error:", err);
    });
  }

  // First install: open /connect-extension
  if (details.reason === "install") {
    const webUrl = "http://localhost:3000/connect-extension";
    chrome.tabs.create({ url: webUrl });
  }
});

// Listen to external messages from the Web App
chrome.runtime.onMessageExternal.addListener(
  (message, sender, sendResponse) => {
    // Validate sender origin
    const validOrigins = [
      "https://root-access-w.vercel.app",
      "http://localhost:3000",
      "http://127.0.0.1:3000",
    ];

    const origin = sender.origin || (sender.url ? new URL(sender.url).origin : "");
    if (!validOrigins.includes(origin)) {
      console.warn("[RootAccess] Blocked external message from unauthorized origin:", origin);
      sendResponse({ ok: false, error: "UNAUTHORIZED_ORIGIN" });
      return;
    }

    if (message.type === "RA_SESSION") {
      const token = message.token || message.access_token;
      const user = message.user;

      chrome.storage.local.set(
        {
          ra_session_token: token,
          ra_user: user,
          ra_connected_at: Date.now(),
        },
        () => {
          console.log("[RootAccess] Session token stored from web app");
          sendResponse({ ok: true, connected: true });
        },
      );
      return true; // async sendResponse
    }

    sendResponse({ ok: false, error: "UNKNOWN_MESSAGE_TYPE" });
  },
);
