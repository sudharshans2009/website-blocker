document.addEventListener("DOMContentLoaded", function () {
  var addSiteButton = document.getElementById("addSite");
  addSiteButton.addEventListener("click", function () {
    var siteInput = document.getElementById("siteInput").value;
    if (siteInput) {
      if (isBlacklisted(siteInput)) {
        alert("This site is blacklisted and cannot be added.");
      } else {
        chrome.storage.sync.get("blockedSites", function (data) {
          var blockedSites = data.blockedSites || [];
          blockedSites.push(siteInput);
          chrome.storage.sync.set({ blockedSites: blockedSites });
          updateBlockedList();
        });
      }
      document.getElementById("siteInput").value = "";
    }
  });

  function isBlacklisted(site) {
    const blacklistedFromAddingSites = [
      "*notion.so",
      "*notion.site",
      "www.google.com"
    ];
    
    return blacklistedFromAddingSites.some(function (pattern) {
      var regex = new RegExp("^" + pattern.replace(/\./g, "\\.").replace(/\*/g, ".*") + "$");
      return regex.test(site);
    });
  }

  function updateBlockedList() {
    chrome.storage.sync.get("blockedSites", function (data) {
      var blockedSites = data.blockedSites || [];
      var blockedList = document.getElementById("blockedList");
      blockedList.innerHTML = "";

      if (blockedSites.length === 0) {
        var message = document.createElement("li");
        message.textContent = "No sites blocked yet...";
        blockedList.appendChild(message);
      } else {
        blockedSites.forEach(function (site) {
          var li = document.createElement("li");
          li.textContent = site;
          var removeButton = document.createElement("button");
          removeButton.textContent = "Remove";
          removeButton.id = "removeSite";
          removeButton.addEventListener("click", function () {
            chrome.storage.sync.get("blockedSites", function (data) {
              var blockedSites = data.blockedSites;
              var index = blockedSites.indexOf(site);
              if (index !== -1) {
                blockedSites.splice(index, 1);
                chrome.storage.sync.set({ blockedSites: blockedSites });
                updateBlockedList();
              }
            });
          });

          li.appendChild(removeButton);
          blockedList.appendChild(li);
        });
      }
    });
  }

  updateBlockedList();
});
