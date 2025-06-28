// Background Script for FocusGuard
chrome.runtime.onInstalled.addListener(function (details) {
  if (details.reason === "install") {
    // Set default settings on first install
    chrome.storage.sync.set({
      blockedSites: [],
      isPaused: false,
      isFocusMode: false,
      strictMode: false,
      showNotifications: true,
      redirectUrl: "notion.so",
      customRedirectUrl: "",
      focusModeSites: [],
    });

    // Open welcome page
    chrome.tabs.create({
      url: chrome.runtime.getURL("welcome.html"),
    });
  }

  if (details.reason === "update") {
    // Migrate old settings if needed
    migrateSettings();
  }

  // Initialize context menus and badge
  setupContextMenus();
  updateBadge();
});

function migrateSettings() {
  chrome.storage.sync.get(null, function (data) {
    // Ensure all new settings have default values
    const defaultSettings = {
      strictMode: false,
      showNotifications: true,
      redirectUrl: "notion.so",
      customRedirectUrl: "",
      isFocusMode: false,
      focusModeSites: [],
    };

    Object.keys(defaultSettings).forEach((key) => {
      if (!(key in data)) {
        data[key] = defaultSettings[key];
      }
    });

    chrome.storage.sync.set(data);
  });
}

// Context menu setup
function setupContextMenus() {
  // Remove existing menus first
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: "blockCurrentSite",
      title: "Block this website",
      contexts: ["page"],
    });

    chrome.contextMenus.create({
      id: "pauseProtection",
      title: "Pause FocusGuard",
      contexts: ["page"],
    });
  });
}

chrome.contextMenus.onClicked.addListener(function (info, tab) {
  if (info.menuItemId === "blockCurrentSite") {
    blockCurrentSite(tab);
  } else if (info.menuItemId === "pauseProtection") {
    togglePause();
  }
});

function blockCurrentSite(tab) {
  if (
    !tab.url ||
    tab.url.startsWith("chrome://") ||
    tab.url.startsWith("chrome-extension://")
  ) {
    return;
  }

  try {
    const hostname = new URL(tab.url).hostname.replace(/^www\./, "");

    chrome.storage.sync.get("blockedSites", function (data) {
      const blockedSites = data.blockedSites || [];

      if (!blockedSites.includes(hostname)) {
        blockedSites.push(hostname);
        chrome.storage.sync.set({ blockedSites: blockedSites }, function () {
          // Show notification
          chrome.notifications.create({
            type: "basic",
            iconUrl: "icons/icon-48.png",
            title: "FocusGuard",
            message: `${hostname} has been blocked`,
          });

          // Reload the tab to apply blocking
          chrome.tabs.reload(tab.id);
        });
      }
    });
  } catch (e) {
    console.error("Error blocking site:", e);
  }
}

function togglePause() {
  chrome.storage.sync.get("isPaused", function (data) {
    const isPaused = !data.isPaused;
    chrome.storage.sync.set({ isPaused: isPaused }, function () {
      chrome.notifications.create({
        type: "basic",
        iconUrl: "icons/icon-48.png",
        title: "FocusGuard",
        message: isPaused ? "Protection paused" : "Protection resumed",
      });
    });
  });
}

// Badge management
chrome.storage.onChanged.addListener(function (changes, namespace) {
  if (namespace === "sync") {
    updateBadge();
  }
});

function updateBadge() {
  chrome.storage.sync.get(["blockedSites", "isPaused"], function (data) {
    const count = (data.blockedSites || []).length;
    const isPaused = data.isPaused || false;

    if (isPaused) {
      chrome.action.setBadgeText({ text: "⏸" });
      chrome.action.setBadgeBackgroundColor({ color: "#f59e0b" });
    } else if (count > 0) {
      chrome.action.setBadgeText({ text: count.toString() });
      chrome.action.setBadgeBackgroundColor({ color: "#6366f1" });
    } else {
      chrome.action.setBadgeText({ text: "" });
    }
  });
}

// Initialize badge on startup
chrome.runtime.onStartup.addListener(updateBadge);

// Handle keyboard shortcuts
chrome.commands.onCommand.addListener(function (command) {
  switch (command) {
    case "toggle-pause":
      togglePause();
      break;
    case "open-popup":
      chrome.action.openPopup();
      break;
  }
});

// Statistics tracking
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  if (changeInfo.status === "complete" && tab.url) {
    trackSiteVisit(tab.url);
  }
});

function trackSiteVisit(url) {
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, "");

    chrome.storage.sync.get(["blockedSites", "siteStats"], function (data) {
      const blockedSites = data.blockedSites || [];
      const siteStats = data.siteStats || {};

      if (blockedSites.includes(hostname)) {
        // Track blocked attempts
        const today = new Date().toDateString();
        if (!siteStats[hostname]) {
          siteStats[hostname] = {};
        }
        if (!siteStats[hostname][today]) {
          siteStats[hostname][today] = 0;
        }
        siteStats[hostname][today]++;

        chrome.storage.sync.set({ siteStats: siteStats });
      }
    });
  } catch (e) {
    // Invalid URL, ignore
    console.error("Error tracking site visit:", e);
  }
}