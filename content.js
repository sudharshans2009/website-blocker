chrome.storage.sync.get("blockedSites", function(data) {
  var blockedSites = data.blockedSites;

  for (var i = 0; i < blockedSites.length; i++) {
    if (window.location.hostname.includes(blockedSites[i])) {
      
      document.documentElement.innerHTML = "";
      window.location = "https://notion.so";
    }
  }
});