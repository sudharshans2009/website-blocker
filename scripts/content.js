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
          :root {
            --background: 0 0% 100%;
            --foreground: 222.2 84% 4.9%;
            --card: 0 0% 100%;
            --card-foreground: 222.2 84% 4.9%;
            --primary: 221.2 83.2% 53.3%;
            --primary-foreground: 210 40% 98%;
            --muted: 210 40% 96%;
            --muted-foreground: 215.4 16.3% 46.9%;
            --border: 214.3 31.8% 91.4%;
            --radius: 0.5rem;
          }
          
          @media (prefers-color-scheme: dark) {
            :root {
              --background: 222.2 84% 4.9%;
              --foreground: 210 40% 98%;
              --card: 222.2 84% 4.9%;
              --card-foreground: 210 40% 98%;
              --primary: 217.2 91.2% 59.8%;
              --primary-foreground: 222.2 84% 4.9%;
              --muted: 217.2 32.6% 17.5%;
              --muted-foreground: 215 20.2% 65.1%;
              --border: 217.2 32.6% 17.5%;
            }
          }
          
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background-color: hsl(var(--background));
            color: hsl(var(--foreground));
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            line-height: 1.6;
          }
          
          .container {
            text-align: center;
            max-width: 500px;
            padding: 48px 32px;
            background-color: hsl(var(--card));
            border: 1px solid hsl(var(--border));
            border-radius: calc(var(--radius) * 2);
            box-shadow: 0 10px 40px hsl(var(--foreground) / 0.1);
            margin: 20px;
          }
          
          .icon {
            font-size: 64px;
            margin-bottom: 24px;
            animation: pulse 2s infinite;
          }
          
          h1 {
            font-size: 32px;
            font-weight: 700;
            margin-bottom: 16px;
            letter-spacing: -0.025em;
            color: hsl(var(--foreground));
          }
          
          p {
            font-size: 16px;
            color: hsl(var(--muted-foreground));
            line-height: 1.6;
            margin-bottom: 24px;
          }
          
          .site-name {
            background-color: hsl(var(--muted));
            color: hsl(var(--foreground));
            padding: 12px 20px;
            border-radius: var(--radius);
            display: inline-block;
            margin: 16px 0;
            font-weight: 600;
            font-family: ui-monospace, SFMono-Regular, "SF Mono", Monaco, Consolas, monospace;
            font-size: 14px;
            border: 1px solid hsl(var(--border));
          }
          
          .redirect-info {
            font-size: 14px;
            color: hsl(var(--muted-foreground));
            margin-top: 24px;
            margin-bottom: 16px;
          }
          
          .progress-container {
            width: 100%;
            margin-top: 20px;
          }
          
          .progress-bar {
            width: 100%;
            height: 6px;
            background-color: hsl(var(--muted));
            border-radius: 3px;
            overflow: hidden;
            margin-top: 16px;
          }
          
          .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, hsl(var(--primary)), hsl(var(--primary)) 50%, hsl(var(--primary) / 0.8));
            border-radius: 3px;
            animation: progress 2s linear;
          }
          
          @keyframes pulse {
            0%, 100% { 
              transform: scale(1); 
              opacity: 1;
            }
            50% { 
              transform: scale(1.05); 
              opacity: 0.8;
            }
          }
          
          @keyframes progress {
            from { width: 0%; }
            to { width: 100%; }
          }
          
          @media (max-width: 600px) {
            .container {
              margin: 16px;
              padding: 32px 24px;
            }
            
            h1 {
              font-size: 24px;
            }
            
            .icon {
              font-size: 48px;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="icon">🛡️</div>
          <h1>Site Blocked</h1>
          <p>This website has been blocked by FocusGuard to help you stay focused and productive.</p>
          <div class="site-name">${window.location.hostname}</div>
          <div class="redirect-info">Redirecting you to a more productive space...</div>
          <div class="progress-container">
            <div class="progress-bar">
              <div class="progress-fill"></div>
            </div>
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