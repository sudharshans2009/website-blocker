// Enhanced Content Script for FocusGuard
(function() {
  'use strict';

  let isBlocked = false;
  let redirectUrl = "https://notion.so";
  let settings = {};

  // Initialize the content script
  init();

  function init() {
    // Load settings and check if current site should be blocked
    chrome.storage.sync.get([
      "blockedSites", "isPaused", "strictMode", "showNotifications", 
      "redirectUrl", "customRedirectUrl"
    ], function(data) {
      settings = data;
      
      // Don't block if paused
      if (data.isPaused) {
        return;
      }

      const blockedSites = data.blockedSites || [];
      const currentHostname = window.location.hostname;
      const currentUrl = window.location.href;
      
      // Check if current site should be blocked
      if (shouldBlockSite(currentHostname, currentUrl, blockedSites, data.strictMode)) {
        blockSite();
      }
    });

    // Listen for storage changes (real-time updates)
    chrome.storage.onChanged.addListener(function(changes, namespace) {
      if (namespace === 'sync') {
        // Reload page if blocking status might have changed
        if (changes.blockedSites || changes.isPaused || changes.strictMode) {
          window.location.reload();
        }
      }
    });
  }

  function shouldBlockSite(hostname, url, blockedSites, strictMode) {
    for (let i = 0; i < blockedSites.length; i++) {
      const blockedSite = blockedSites[i].toLowerCase();
      const currentHost = hostname.toLowerCase();
      
      if (strictMode) {
        // Strict mode: block exact matches and all subdomains
        if (currentHost === blockedSite || 
            currentHost.endsWith('.' + blockedSite) ||
            blockedSite.endsWith('.' + currentHost)) {
          return true;
        }
      } else {
        // Normal mode: block if hostname contains the blocked site
        if (currentHost.includes(blockedSite) || blockedSite.includes(currentHost)) {
          return true;
        }
      }
    }
    return false;
  }

  function blockSite() {
    if (isBlocked) return;
    isBlocked = true;

    // Determine redirect URL
    redirectUrl = getRedirectUrl();

    // Show notification if enabled
    if (settings.showNotifications !== false) {
      showBlockNotification();
    }

    // Clear page content immediately
    document.documentElement.innerHTML = "";
    
    // Create a temporary blocking page
    createBlockingPage();
    
    // Redirect after a short delay
    setTimeout(() => {
      window.location.href = redirectUrl;
    }, 2000);
  }

  function getRedirectUrl() {
    const redirectSetting = settings.redirectUrl || "notion.so";
    
    switch(redirectSetting) {
      case "google.com":
        return "https://www.google.com";
      case "blank":
        return "about:blank";
      case "custom":
        return settings.customRedirectUrl || "https://notion.so";
      case "notion.so":
      default:
        return "https://notion.so";
    }
  }

  function createBlockingPage() {
    const blockedPageHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Site Blocked - FocusGuard</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
          }
          
          .container {
            text-align: center;
            max-width: 500px;
            padding: 40px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 20px;
            backdrop-filter: blur(10px);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
          }
          
          .icon {
            font-size: 64px;
            margin-bottom: 20px;
            animation: pulse 2s infinite;
          }
          
          h1 {
            font-size: 28px;
            font-weight: 700;
            margin-bottom: 16px;
            letter-spacing: -0.025em;
          }
          
          p {
            font-size: 16px;
            opacity: 0.9;
            line-height: 1.6;
            margin-bottom: 24px;
          }
          
          .site-name {
            background: rgba(255, 255, 255, 0.2);
            padding: 8px 16px;
            border-radius: 12px;
            display: inline-block;
            margin: 16px 0;
            font-weight: 600;
          }
          
          .redirect-info {
            font-size: 14px;
            opacity: 0.8;
            margin-top: 20px;
          }
          
          .progress-bar {
            width: 100%;
            height: 4px;
            background: rgba(255, 255, 255, 0.3);
            border-radius: 2px;
            overflow: hidden;
            margin-top: 16px;
          }
          
          .progress-fill {
            height: 100%;
            background: white;
            border-radius: 2px;
            animation: progress 2s linear;
          }
          
          @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.1); }
          }
          
          @keyframes progress {
            from { width: 0%; }
            to { width: 100%; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="icon">🛡️</div>
          <h1>Site Blocked</h1>
          <p>This website has been blocked by FocusGuard to help you stay focused.</p>
          <div class="site-name">${window.location.hostname}</div>
          <div class="redirect-info">Redirecting you to a more productive space...</div>
          <div class="progress-bar">
            <div class="progress-fill"></div>
          </div>
        </div>
      </body>
      </html>
    `;
    
    document.documentElement.innerHTML = blockedPageHTML;
  }

  function showBlockNotification() {
    // Only show notification if we're not already showing the blocking page
    if (!document.querySelector('.container')) {
      console.log(`🛡️ FocusGuard: ${window.location.hostname} has been blocked`);
    }
  }

  // Prevent navigation attempts
  window.addEventListener('beforeunload', function(e) {
    if (isBlocked) {
      e.preventDefault();
      return '';
    }
  });

  // Block attempts to modify the page
  const observer = new MutationObserver(function(mutations) {
    if (isBlocked) {
      mutations.forEach(function(mutation) {
        if (mutation.type === 'childList' && !mutation.target.closest('.container')) {
          // Prevent unauthorized changes to the blocking page
          createBlockingPage();
        }
      });
    }
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true
  });

})();