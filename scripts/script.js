// Enhanced Website Blocker Script
document.addEventListener("DOMContentLoaded", function () {
  // DOM Elements
  const addSiteButton = document.getElementById("addSite");
  const siteInput = document.getElementById("siteInput");
  const blockedList = document.getElementById("blockedList");
  const blockedCountElement = document.getElementById("blockedCount");
  const pauseButton = document.getElementById("pauseButton");
  const focusModeButton = document.getElementById("focusMode");
  const clearAllButton = document.getElementById("clearAll");
  const exportButton = document.getElementById("exportList");
  const searchInput = document.getElementById("searchInput");
  const suggestionTags = document.querySelectorAll(".suggestion-tag");
  const strictModeCheckbox = document.getElementById("strictMode");
  const showNotificationsCheckbox = document.getElementById("showNotifications");
  const redirectSelect = document.getElementById("redirectSelect");
  const customRedirectInput = document.getElementById("customRedirect");
  const themeToggle = document.getElementById("themeToggle");
  const themeIcon = document.getElementById("themeIcon");

  // State management
  let currentSearchTerm = "";
  let isPaused = false;
  let isFocusMode = false;

  // Initialize the extension
  init();

  function init() {
    initializeTheme();
    loadSettings();
    updateBlockedList();
    updateStats();
    setupEventListeners();
    updateButtonStates();
  }

  function setupEventListeners() {
    // Theme toggle
    themeToggle.addEventListener("click", toggleTheme);
    
    // Add site functionality
    addSiteButton.addEventListener("click", addSite);
    siteInput.addEventListener("keypress", function(e) {
      if (e.key === "Enter") {
        addSite();
      }
    });

    // Suggestion tags
    suggestionTags.forEach(tag => {
      tag.addEventListener("click", function() {
        const site = this.dataset.site;
        siteInput.value = site;
        addSite();
      });
    });

    // Quick actions
    pauseButton.addEventListener("click", togglePause);
    focusModeButton.addEventListener("click", toggleFocusMode);

    // Bulk actions
    clearAllButton.addEventListener("click", clearAllSites);
    exportButton.addEventListener("click", exportBlockedList);

    // Search functionality
    searchInput.addEventListener("input", function() {
      currentSearchTerm = this.value.toLowerCase();
      updateBlockedList();
    });

    // Settings
    strictModeCheckbox.addEventListener("change", saveSettings);
    showNotificationsCheckbox.addEventListener("change", saveSettings);
    redirectSelect.addEventListener("change", function() {
      customRedirectInput.style.display = this.value === "custom" ? "block" : "none";
      saveSettings();
    });
    customRedirectInput.addEventListener("input", saveSettings);
  }

  function addSite() {
    const siteUrl = siteInput.value.trim().toLowerCase();
    
    if (!siteUrl) {
      showNotification("Please enter a website URL", "error");
      return;
    }

    // Clean the URL
    const cleanedUrl = cleanUrl(siteUrl);
    
    if (!isValidUrl(cleanedUrl)) {
      showNotification("Please enter a valid website URL", "error");
      return;
    }

    if (isBlacklisted(cleanedUrl)) {
      showNotification("This site cannot be blocked", "error");
      return;
    }

    chrome.storage.sync.get("blockedSites", function (data) {
      const blockedSites = data.blockedSites || [];
      
      if (blockedSites.includes(cleanedUrl)) {
        showNotification("This site is already blocked", "warning");
        return;
      }

      blockedSites.push(cleanedUrl);
      chrome.storage.sync.set({ blockedSites: blockedSites }, function() {
        updateBlockedList();
        updateStats();
        siteInput.value = "";
        showNotification(`${cleanedUrl} has been blocked`, "success");
      });
    });
  }

  function removeSite(site) {
    chrome.storage.sync.get("blockedSites", function (data) {
      const blockedSites = data.blockedSites || [];
      const index = blockedSites.indexOf(site);
      
      if (index !== -1) {
        blockedSites.splice(index, 1);
        chrome.storage.sync.set({ blockedSites: blockedSites }, function() {
          updateBlockedList();
          updateStats();
          showNotification(`${site} has been unblocked`, "success");
        });
      }
    });
  }

  function updateBlockedList() {
    chrome.storage.sync.get("blockedSites", function (data) {
      const blockedSites = data.blockedSites || [];
      blockedList.innerHTML = "";

      // Filter sites based on search term
      const filteredSites = blockedSites.filter(site => 
        site.toLowerCase().includes(currentSearchTerm)
      );

      if (filteredSites.length === 0) {
        const emptyState = document.createElement("li");
        emptyState.className = "empty-state";
        
        if (currentSearchTerm) {
          emptyState.innerHTML = `
            <div class="empty-icon">🔍</div>
            <p>No sites found</p>
            <small>Try a different search term</small>
          `;
        } else {
          emptyState.innerHTML = `
            <div class="empty-icon">🌟</div>
            <p>No websites blocked yet</p>
            <small>Add sites above to start focusing!</small>
          `;
        }
        
        blockedList.appendChild(emptyState);
      } else {
        filteredSites.forEach(site => {
          const li = document.createElement("li");
          li.innerHTML = `
            <div class="site-info">
              <div class="site-name">${getSiteName(site)}</div>
              <div class="site-url">${site}</div>
            </div>
            <button class="remove-btn" data-site="${site}">Remove</button>
          `;

          const removeButton = li.querySelector(".remove-btn");
          removeButton.addEventListener("click", function() {
            removeSite(this.dataset.site);
          });

          blockedList.appendChild(li);
        });
      }
    });
  }

  function updateStats() {
    chrome.storage.sync.get("blockedSites", function (data) {
      const count = (data.blockedSites || []).length;
      blockedCountElement.textContent = count;
    });
  }

  function togglePause() {
    isPaused = !isPaused;
    chrome.storage.sync.set({ isPaused: isPaused }, function() {
      updateButtonStates();
      const message = isPaused ? "Protection paused" : "Protection resumed";
      showNotification(message, "info");
    });
  }

  function toggleFocusMode() {
    isFocusMode = !isFocusMode;
    
    if (isFocusMode) {
      // Add common distracting sites
      const focusModeSites = [
        "youtube.com", "facebook.com", "twitter.com", "instagram.com", 
        "tiktok.com", "reddit.com", "netflix.com", "twitch.tv"
      ];
      
      chrome.storage.sync.get("blockedSites", function (data) {
        let blockedSites = data.blockedSites || [];
        let addedSites = [];
        
        focusModeSites.forEach(site => {
          if (!blockedSites.includes(site)) {
            blockedSites.push(site);
            addedSites.push(site);
          }
        });
        
        chrome.storage.sync.set({ 
          blockedSites: blockedSites,
          isFocusMode: isFocusMode,
          focusModeSites: addedSites
        }, function() {
          updateBlockedList();
          updateStats();
          updateButtonStates();
          showNotification(`Focus mode activated! Added ${addedSites.length} sites`, "success");
        });
      });
    } else {
      // Remove focus mode sites
      chrome.storage.sync.get(["blockedSites", "focusModeSites"], function (data) {
        let blockedSites = data.blockedSites || [];
        const focusModeSites = data.focusModeSites || [];
        
        focusModeSites.forEach(site => {
          const index = blockedSites.indexOf(site);
          if (index !== -1) {
            blockedSites.splice(index, 1);
          }
        });
        
        chrome.storage.sync.set({ 
          blockedSites: blockedSites,
          isFocusMode: isFocusMode,
          focusModeSites: []
        }, function() {
          updateBlockedList();
          updateStats();
          updateButtonStates();
          showNotification("Focus mode deactivated", "info");
        });
      });
    }
  }

  function clearAllSites() {
    if (confirm("Are you sure you want to remove all blocked sites?")) {
      chrome.storage.sync.set({ 
        blockedSites: [],
        focusModeSites: [],
        isFocusMode: false
      }, function() {
        updateBlockedList();
        updateStats();
        isFocusMode = false;
        updateButtonStates();
        showNotification("All sites cleared", "info");
      });
    }
  }

  function exportBlockedList() {
    chrome.storage.sync.get("blockedSites", function (data) {
      const blockedSites = data.blockedSites || [];
      
      if (blockedSites.length === 0) {
        showNotification("No sites to export", "warning");
        return;
      }
      
      const exportData = {
        exportDate: new Date().toISOString(),
        blockedSites: blockedSites,
        totalSites: blockedSites.length
      };
      
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `focusguard-blocklist-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      
      URL.revokeObjectURL(url);
      showNotification("Blocklist exported successfully", "success");
    });
  }

  function updateButtonStates() {
    chrome.storage.sync.get(["isPaused", "isFocusMode"], function(data) {
      isPaused = data.isPaused || false;
      isFocusMode = data.isFocusMode || false;
      
      pauseButton.classList.toggle("active", isPaused);
      focusModeButton.classList.toggle("active", isFocusMode);
      
      pauseButton.querySelector(".btn-text").textContent = isPaused ? "Resume Protection" : "Pause Protection";
      pauseButton.querySelector(".btn-icon").textContent = isPaused ? "▶️" : "⏸️";
      
      focusModeButton.querySelector(".btn-text").textContent = isFocusMode ? "Exit Focus Mode" : "Focus Mode";
      focusModeButton.querySelector(".btn-icon").textContent = isFocusMode ? "🔓" : "🎯";
    });
  }

  function loadSettings() {
    chrome.storage.sync.get([
      "strictMode", "showNotifications", "redirectUrl", "customRedirectUrl"
    ], function(data) {
      strictModeCheckbox.checked = data.strictMode || false;
      showNotificationsCheckbox.checked = data.showNotifications !== false; // Default to true
      redirectSelect.value = data.redirectUrl || "notion.so";
      customRedirectInput.value = data.customRedirectUrl || "";
      
      if (redirectSelect.value === "custom") {
        customRedirectInput.style.display = "block";
      }
    });
  }

  function saveSettings() {
    const settings = {
      strictMode: strictModeCheckbox.checked,
      showNotifications: showNotificationsCheckbox.checked,
      redirectUrl: redirectSelect.value,
      customRedirectUrl: customRedirectInput.value
    };
    
    chrome.storage.sync.set(settings);
  }

  function isBlacklisted(site) {
    const blacklistedSites = [
      "notion.so", "notion.site", "google.com", "chrome://", "chrome-extension://",
      "localhost", "127.0.0.1", "about:", "file://"
    ];
    
    return blacklistedSites.some(blocked => 
      site.includes(blocked) || blocked.includes(site)
    );
  }

  function cleanUrl(url) {
    // Remove protocol
    url = url.replace(/^https?:\/\//, '');
    // Remove www
    url = url.replace(/^www\./, '');
    // Remove trailing slash and path
    url = url.split('/')[0];
    // Remove port
    url = url.split(':')[0];
    
    return url;
  }

  function isValidUrl(url) {
    const urlPattern = /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/;
    return urlPattern.test(url) || /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(url);
  }

  function getSiteName(url) {
    // Convert URL to a readable name
    const name = url.split('.')[0];
    return name.charAt(0).toUpperCase() + name.slice(1);
  }

  function showNotification(message, type = "info") {
    // Create notification element
    const notification = document.createElement("div");
    notification.className = `notification notification-${type}`;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${getNotificationColor(type)};
      color: white;
      padding: 12px 16px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      z-index: 10000;
      animation: slideInRight 0.3s ease-out;
      max-width: 300px;
      word-wrap: break-word;
    `;
    
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // Add animation styles if not already present
    if (!document.getElementById("notification-styles")) {
      const style = document.createElement("style");
      style.id = "notification-styles";
      style.textContent = `
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOutRight {
          from { transform: translateX(0); opacity: 1; }
          to { transform: translateX(100%); opacity: 0; }
        }
      `;
      document.head.appendChild(style);
    }
    
    // Auto remove after 3 seconds
    setTimeout(() => {
      notification.style.animation = "slideOutRight 0.3s ease-in";
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 3000);
  }

  function getNotificationColor(type) {
    const colors = {
      success: "#10b981",
      error: "#ef4444",
      warning: "#f59e0b",
      info: "#3b82f6"
    };
    return colors[type] || colors.info;
  }

  // Theme Management Functions
  function initializeTheme() {
    chrome.storage.sync.get("theme", function(data) {
      const theme = data.theme || "auto";
      applyTheme(theme);
    });
  }

  function toggleTheme() {
    chrome.storage.sync.get("theme", function(data) {
      const currentTheme = data.theme || "auto";
      let newTheme;
      
      // Cycle through: auto -> light -> dark -> auto
      if (currentTheme === "auto") {
        newTheme = "light";
      } else if (currentTheme === "light") {
        newTheme = "dark";
      } else {
        newTheme = "auto";
      }
      
      chrome.storage.sync.set({ theme: newTheme }, function() {
        applyTheme(newTheme);
      });
    });
  }

  function applyTheme(theme) {
    const body = document.body;
    const html = document.documentElement;
    
    // Remove existing theme attributes
    body.removeAttribute("data-theme");
    html.removeAttribute("data-theme");
    
    if (theme === "light") {
      body.setAttribute("data-theme", "light");
      html.setAttribute("data-theme", "light");
      themeIcon.textContent = "☀️";
      themeToggle.title = "Switch to dark mode";
    } else if (theme === "dark") {
      body.setAttribute("data-theme", "dark");
      html.setAttribute("data-theme", "dark");
      themeIcon.textContent = "🌙";
      themeToggle.title = "Switch to auto mode";
    } else {
      // Auto mode - let CSS prefers-color-scheme handle it
      themeIcon.textContent = "🌓";
      themeToggle.title = "Switch to light mode";
    }
  }
});